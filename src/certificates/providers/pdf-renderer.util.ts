import { Order } from 'src/orders/order.entity';
import { User } from 'src/users/user.entity';
import { Course } from 'src/courses/course.entity';
import { renderPdf } from '../utils/pdf-renderer';

function formatBillingAddress(
  billingAddress?: Order['billingAddress'] | null,
): string {
  if (!billingAddress) return 'Billing address not available';

  return [
    billingAddress.address,
    billingAddress.city,
    billingAddress.state,
    billingAddress.country,
    billingAddress.pincode,
  ]
    .filter(Boolean)
    .join(', ');
}

function formatPaymentMode(order: Order): string {
  if (order.paymentMode === 'upi') return 'UPI';

  if (order.paymentMode === 'card') return 'Card';

  if (order.paymentMode === 'netbanking') {
    return order.paymentBank
      ? `Net Banking (${order.paymentBank})`
      : 'Net Banking';
  }

  if (order.paymentMode === 'wallet') {
    return order.paymentWallet ? `Wallet (${order.paymentWallet})` : 'Wallet';
  }

  return order.paymentMode || 'N/A';
}
export async function renderInvoicePdf(order: Order) {
  const items = order.items.map((item) => {
    const quantity = Number(item.quantity || 1);
    const price = Number(item.price || 0);
    const amount = quantity * price;

    return {
      title: item.course.title,
      quantity,
      price: price.toFixed(2),
      amount: amount.toFixed(2),
    };
  });

  const subTotal = Number(order.subTotal || 0);
  const discount = Number(order.discount || 0);
  const tax = Number(order.tax || 0);
  const totalAmount = Number(order.totalAmount || 0);

  const billingAddress = order.billingAddress;
  const customerName =
    [billingAddress?.firstName, billingAddress?.lastName]
      .filter(Boolean)
      .join(' ')
      .trim() ||
    [order.user?.firstName, order.user?.lastName]
      .filter(Boolean)
      .join(' ')
      .trim() ||
    'Customer';

  const customerEmail = billingAddress?.email || order.user?.email || '';
  const customerPhoneNumber =
    billingAddress?.phoneNumber || order.user?.phoneNumber || '';

  return renderPdf('invoice', {
    orderId: order.id,
    invoiceNumber: `INV-${new Date(order.createdAt).getFullYear()}-${String(
      order.id,
    ).padStart(6, '0')}`,
    issuedAt: new Date(order.paidAt || order.updatedAt).toLocaleDateString(
      'en-IN',
      {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      },
    ),
    customerName,
    customerEmail,
    customerPhoneNumber,
    billingAddress: formatBillingAddress(order.billingAddress),
    paymentMethod: order.paymentMethod || 'Online Payment',
    paymentMode: formatPaymentMode(order),
    paymentId: order.paymentId || 'N/A',
    gatewayOrderId: order.orderId || 'N/A',
    paidAt: order.paidAt
      ? new Date(order.paidAt).toLocaleString('en-IN', {
          day: '2-digit',
          month: 'long',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        })
      : 'N/A',
    items,
    subTotal: subTotal.toFixed(2),
    discount: discount.toFixed(2),
    tax: tax.toFixed(2),
    totalAmount: totalAmount.toFixed(2),
    amountInWords: amountToWords(totalAmount),
  });
}

function numberToWords(num: number): string {
  const ones = [
    '',
    'One',
    'Two',
    'Three',
    'Four',
    'Five',
    'Six',
    'Seven',
    'Eight',
    'Nine',
    'Ten',
    'Eleven',
    'Twelve',
    'Thirteen',
    'Fourteen',
    'Fifteen',
    'Sixteen',
    'Seventeen',
    'Eighteen',
    'Nineteen',
  ];

  const tens = [
    '',
    '',
    'Twenty',
    'Thirty',
    'Forty',
    'Fifty',
    'Sixty',
    'Seventy',
    'Eighty',
    'Ninety',
  ];

  const convertHundred = (n: number): string => {
    let word = '';

    if (n > 99) {
      word += ones[Math.floor(n / 100)] + ' Hundred ';
      n %= 100;
    }

    if (n > 19) {
      word += tens[Math.floor(n / 10)] + ' ';
      n %= 10;
    }

    if (n > 0) {
      word += ones[n] + ' ';
    }

    return word.trim();
  };

  if (num === 0) return 'Zero';

  let words = '';
  const crore = Math.floor(num / 10000000);
  num %= 10000000;

  const lakh = Math.floor(num / 100000);
  num %= 100000;

  const thousand = Math.floor(num / 1000);
  num %= 1000;

  if (crore) words += convertHundred(crore) + ' Crore ';
  if (lakh) words += convertHundred(lakh) + ' Lakh ';
  if (thousand) words += convertHundred(thousand) + ' Thousand ';
  if (num) words += convertHundred(num);

  return words.trim();
}

function amountToWords(amount: number): string {
  const rupees = Math.floor(amount);
  const paise = Math.round((amount - rupees) * 100);

  let words = `${numberToWords(rupees)} Rupees`;

  if (paise > 0) {
    words += ` and ${numberToWords(paise)} Paise`;
  }

  return `${words} Only`;
}

export async function renderCertificatePdf(params: {
  user: User;
  course: Course;
  certificateNumber: string;
  issuedAt: Date;
  avatarUrl?: string | null;
}) {
  return renderPdf('certificate', {
    name: [params.user.firstName, params.user.lastName]
      .filter(Boolean)
      .join(' ')
      .trim(),
    firstName: params.user.firstName,
    lastName: params.user.lastName,
    firstNameInitial: params.user.firstName?.charAt(0)?.toUpperCase() || 'U',
    courseTitle: params.course.title,
    certificateNumber: params.certificateNumber,
    issuedAt: new Date(params.issuedAt).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'numeric',
      year: 'numeric',
    }),
    avatarUrl: params.avatarUrl || null,
  });
}
