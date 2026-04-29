export interface ActiveUserData {
  //Id of the user
  sub: number;

  //Email of the user
  email: string;

  //Roles of the user
  roles: string[];
}
