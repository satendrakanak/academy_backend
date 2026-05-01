import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ActiveUserData } from 'src/auth/interfaces/active-user-data.interface';
import { EnrollmentsService } from 'src/enrollments/providers/enrollments.service';
import { Order } from 'src/orders/order.entity';
import { OrderStatus } from 'src/orders/enums/orderStatus.enum';
import { PaymentsService } from 'src/payments/providers/payments.service';
import { User } from 'src/users/user.entity';
import { Repository } from 'typeorm';
import { CreateRefundRequestDto } from '../dtos/create-refund-request.dto';
import {
  RefundDecision,
  ReviewRefundRequestDto,
} from '../dtos/review-refund-request.dto';
import { RefundActorType } from '../enums/refund-actor-type.enum';
import { RefundLogAction } from '../enums/refund-log-action.enum';
import { RefundRequestStatus } from '../enums/refund-request-status.enum';
import { RefundLog } from '../refund-log.entity';
import { RefundRequest } from '../refund-request.entity';

@Injectable()
export class RefundsService {
  constructor(
    @InjectRepository(RefundRequest)
    private readonly refundRequestRepository: Repository<RefundRequest>,

    @InjectRepository(RefundLog)
    private readonly refundLogRepository: Repository<RefundLog>,

    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    private readonly paymentsService: PaymentsService,
    private readonly enrollmentsService: EnrollmentsService,
  ) {}

  async findAllAdmin() {
    return this.refundRequestRepository.find({
      relations: [
        'order',
        'order.items',
        'order.items.course',
        'order.items.course.image',
        'order.user',
        'requester',
        'reviewedBy',
        'logs',
        'logs.actor',
      ],
      order: {
        createdAt: 'DESC',
        logs: {
          createdAt: 'ASC',
        },
      },
    });
  }

  async findMine(userId: number) {
    return this.refundRequestRepository.find({
      where: { requester: { id: userId } },
      relations: [
        'order',
        'order.items',
        'order.items.course',
        'order.items.course.image',
        'requester',
        'reviewedBy',
        'logs',
        'logs.actor',
      ],
      order: {
        createdAt: 'DESC',
        logs: {
          createdAt: 'ASC',
        },
      },
    });
  }

  async findOneById(id: number) {
    const refundRequest = await this.refundRequestRepository.findOne({
      where: { id },
      relations: [
        'order',
        'order.items',
        'order.items.course',
        'order.items.course.image',
        'order.user',
        'requester',
        'reviewedBy',
        'logs',
        'logs.actor',
      ],
      order: {
        logs: {
          createdAt: 'ASC',
        },
      },
    });

    if (!refundRequest) {
      throw new NotFoundException('Refund request not found');
    }

    return refundRequest;
  }

  async createRequest(
    orderId: number,
    user: ActiveUserData,
    dto: CreateRefundRequestDto,
  ) {
    const order = await this.orderRepository.findOne({
      where: { id: orderId, user: { id: user.sub } },
      relations: ['items', 'items.course', 'user', 'refundRequests'],
      order: {
        refundRequests: {
          createdAt: 'DESC',
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (
      ![
        OrderStatus.PAID,
        OrderStatus.REFUND_REJECTED,
        OrderStatus.REFUND_FAILED,
      ].includes(order.status)
    ) {
      throw new BadRequestException(
        'Refund can only be requested for paid orders',
      );
    }

    const activeRequest = (order.refundRequests || []).find((request) =>
      [
        RefundRequestStatus.REQUESTED,
        RefundRequestStatus.APPROVED,
        RefundRequestStatus.PROCESSING,
        RefundRequestStatus.COMPLETED,
      ].includes(request.status),
    );

    if (activeRequest) {
      throw new BadRequestException(
        activeRequest.status === RefundRequestStatus.COMPLETED
          ? 'Refund already completed for this order'
          : 'A refund request is already active for this order',
      );
    }

    const requester = await this.userRepository.findOne({
      where: { id: user.sub },
    });

    if (!requester) {
      throw new NotFoundException('User not found');
    }

    const refundRequest = this.refundRequestRepository.create({
      order,
      requester,
      reason: dto.reason.trim(),
      customerNote: dto.customerNote?.trim() || null,
      requestedAmount: Number(order.totalAmount || 0),
      status: RefundRequestStatus.REQUESTED,
    });

    const savedRequest = await this.refundRequestRepository.save(refundRequest);

    await this.orderRepository.update(order.id, {
      status: OrderStatus.REFUND_REQUESTED,
    });

    await this.createLog(savedRequest, {
      actorId: requester.id,
      actorType: this.getActorType(user.roles),
      action: RefundLogAction.REQUESTED,
      toStatus: RefundRequestStatus.REQUESTED,
      message: `Refund requested for order #${order.id}`,
      metadata: {
        reason: dto.reason,
      },
    });

    return this.findOneById(savedRequest.id);
  }

  async reviewRequest(
    refundRequestId: number,
    admin: ActiveUserData,
    dto: ReviewRefundRequestDto,
  ) {
    const refundRequest = await this.findOneById(refundRequestId);

    if (refundRequest.status !== RefundRequestStatus.REQUESTED) {
      throw new BadRequestException(
        'Only newly requested refunds can be reviewed',
      );
    }

    const reviewer = await this.userRepository.findOne({
      where: { id: admin.sub },
    });

    if (!reviewer) {
      throw new NotFoundException('Reviewer not found');
    }

    const previousStatus = refundRequest.status;
    refundRequest.reviewedBy = reviewer;
    refundRequest.reviewedAt = new Date();
    refundRequest.adminNote = dto.adminNote?.trim() || null;

    if (dto.decision === RefundDecision.REJECT) {
      refundRequest.status = RefundRequestStatus.REJECTED;
      refundRequest.rejectedAt = new Date();
      const order = refundRequest.order;
      if (order) {
        order.status = OrderStatus.PAID;
      }

      await this.refundRequestRepository.save(refundRequest);
      if (order) {
        await this.orderRepository.save(order);
      }

      await this.createLog(refundRequest, {
        actorId: reviewer.id,
        actorType: RefundActorType.ADMIN,
        action: RefundLogAction.REJECTED,
        fromStatus: previousStatus,
        toStatus: RefundRequestStatus.REJECTED,
        message: dto.adminNote || 'Refund request rejected by admin',
      });

      return this.findOneById(refundRequest.id);
    }

    const order = this.getRefundOrderOrThrow(refundRequest);

    const approvedAmount = Number(
      dto.approvedAmount ?? refundRequest.requestedAmount,
    );

    if (
      approvedAmount <= 0 ||
      approvedAmount > Number(order.totalAmount || 0)
    ) {
      throw new BadRequestException('Approved amount is invalid');
    }

    refundRequest.status = RefundRequestStatus.APPROVED;
    refundRequest.approvedAmount = approvedAmount;
    order.status = OrderStatus.REFUND_APPROVED;

    await this.refundRequestRepository.save(refundRequest);
    await this.orderRepository.save(order);

    await this.createLog(refundRequest, {
      actorId: reviewer.id,
      actorType: RefundActorType.ADMIN,
      action: RefundLogAction.APPROVED,
      fromStatus: previousStatus,
      toStatus: RefundRequestStatus.APPROVED,
      message: dto.adminNote || 'Refund request approved by admin',
      metadata: {
        approvedAmount,
      },
    });

    return this.processApprovedRefund(refundRequest.id, reviewer.id);
  }

  async syncRefundStatus(refundRequestId: number, admin: ActiveUserData) {
    const refundRequest = await this.findOneById(refundRequestId);
    const order = this.getRefundOrderOrThrow(refundRequest);

    if (!refundRequest.gatewayRefundId || !order.paymentId) {
      throw new BadRequestException('Gateway refund details are missing');
    }

    const gatewayRefund = await this.paymentsService.fetchRefund(
      order.paymentId,
      refundRequest.gatewayRefundId,
    );

    refundRequest.gatewayStatus = String(gatewayRefund?.status || '');
    refundRequest.gatewayReference =
      (gatewayRefund?.acquirer_data?.arn as string | undefined) || null;
    refundRequest.gatewayPayload = gatewayRefund as unknown as Record<
      string,
      unknown
    >;
    await this.refundRequestRepository.save(refundRequest);

    await this.createLog(refundRequest, {
      actorId: admin.sub,
      actorType: RefundActorType.ADMIN,
      action: RefundLogAction.SYNCED,
      fromStatus: refundRequest.status,
      toStatus: refundRequest.status,
      message: `Refund status synced from gateway (${refundRequest.gatewayStatus || 'unknown'})`,
    });

    if (refundRequest.gatewayStatus === 'processed') {
      await this.completeRefund(refundRequest, null);
    } else if (refundRequest.gatewayStatus === 'failed') {
      await this.failRefund(
        refundRequest,
        'Gateway marked the refund as failed during sync',
        null,
      );
    }

    return this.findOneById(refundRequest.id);
  }

  private async processApprovedRefund(
    refundRequestId: number,
    reviewerId: number,
  ) {
    const refundRequest = await this.findOneById(refundRequestId);
    const order = this.getRefundOrderOrThrow(refundRequest);

    if (!order.paymentId) {
      await this.failRefund(
        refundRequest,
        'Payment id missing on order. Refund cannot be processed.',
        reviewerId,
      );
      throw new BadRequestException('Payment id missing on order');
    }

    const previousStatus = refundRequest.status;
    refundRequest.status = RefundRequestStatus.PROCESSING;
    refundRequest.processedAt = new Date();
    order.status = OrderStatus.REFUND_PROCESSING;

    await this.refundRequestRepository.save(refundRequest);
    await this.orderRepository.save(order);

    await this.createLog(refundRequest, {
      actorId: reviewerId,
      actorType: RefundActorType.ADMIN,
      action: RefundLogAction.PROCESSING,
      fromStatus: previousStatus,
      toStatus: RefundRequestStatus.PROCESSING,
      message: 'Refund approved and sent to payment gateway',
      metadata: {
        approvedAmount: refundRequest.approvedAmount,
      },
    });

    try {
      const gatewayRefund = await this.paymentsService.refundPayment(
        order.paymentId,
        Number(refundRequest.approvedAmount || refundRequest.requestedAmount),
        {
          orderId: String(order.id),
          refundRequestId: String(refundRequest.id),
        },
      );

      refundRequest.gatewayRefundId = gatewayRefund?.id || null;
      refundRequest.gatewayStatus = gatewayRefund?.status || null;
      refundRequest.gatewayReference =
        (gatewayRefund?.acquirer_data?.arn as string | undefined) || null;
      refundRequest.gatewayPayload = gatewayRefund as unknown as Record<
        string,
        unknown
      >;

      await this.refundRequestRepository.save(refundRequest);

      if (refundRequest.gatewayStatus === 'processed') {
        await this.completeRefund(refundRequest, reviewerId);
      }

      return this.findOneById(refundRequest.id);
    } catch (error: unknown) {
      await this.failRefund(
        refundRequest,
        error instanceof Error ? error.message : 'Failed to process refund',
        reviewerId,
      );

      throw new InternalServerErrorException('Failed to process refund');
    }
  }

  private async completeRefund(
    refundRequest: RefundRequest,
    actorId: number | null,
  ) {
    const previousStatus = refundRequest.status;

    refundRequest.status = RefundRequestStatus.COMPLETED;
    refundRequest.completedAt = new Date();
    const order = this.getRefundOrderOrThrow(refundRequest);
    order.status = OrderStatus.REFUNDED;

    await this.refundRequestRepository.save(refundRequest);
    await this.orderRepository.save(order);
    await this.enrollmentsService.deactivateByOrder(order.id);

    await this.createLog(refundRequest, {
      actorId,
      actorType: actorId ? RefundActorType.ADMIN : RefundActorType.GATEWAY,
      action: RefundLogAction.COMPLETED,
      fromStatus: previousStatus,
      toStatus: RefundRequestStatus.COMPLETED,
      message: 'Refund completed successfully',
      metadata: {
        refundId: refundRequest.gatewayRefundId,
        gatewayStatus: refundRequest.gatewayStatus,
      },
    });
  }

  private async failRefund(
    refundRequest: RefundRequest,
    message: string,
    actorId: number | null,
  ) {
    const previousStatus = refundRequest.status;

    refundRequest.status = RefundRequestStatus.FAILED;
    refundRequest.failedAt = new Date();
    const order = this.getRefundOrderOrThrow(refundRequest);
    order.status = OrderStatus.REFUND_FAILED;

    await this.refundRequestRepository.save(refundRequest);
    await this.orderRepository.save(order);

    await this.createLog(refundRequest, {
      actorId,
      actorType: actorId ? RefundActorType.ADMIN : RefundActorType.SYSTEM,
      action: RefundLogAction.FAILED,
      fromStatus: previousStatus,
      toStatus: RefundRequestStatus.FAILED,
      message,
    });
  }

  private async createLog(
    refundRequest: RefundRequest,
    options: {
      actorId?: number | null;
      actorType: RefundActorType;
      action: RefundLogAction;
      fromStatus?: RefundRequestStatus | null;
      toStatus?: RefundRequestStatus | null;
      message?: string | null;
      metadata?: Record<string, unknown>;
    },
  ) {
    const actor = options.actorId
      ? await this.userRepository.findOne({ where: { id: options.actorId } })
      : null;

    const log = this.refundLogRepository.create({
      refundRequest,
      actor,
      actorType: options.actorType,
      action: options.action,
      fromStatus: options.fromStatus || null,
      toStatus: options.toStatus || null,
      message: options.message || null,
      metadata: options.metadata || null,
    });

    return this.refundLogRepository.save(log);
  }

  private getActorType(roles: string[]) {
    return roles.some((role) => role.toLowerCase().includes('admin'))
      ? RefundActorType.ADMIN
      : RefundActorType.USER;
  }

  private getRefundOrderOrThrow(refundRequest: RefundRequest) {
    if (!refundRequest.order) {
      throw new NotFoundException(
        'Linked order was not found for this refund request',
      );
    }

    return refundRequest.order;
  }
}
