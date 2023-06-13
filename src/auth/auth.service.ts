import { Injectable } from '@nestjs/common';

@Injectable({})
export class AuthService {
  signin() {
    return { message: 'On sign in' };
  }
  signup() {
    return { message: 'On sign up' };
  }
}
