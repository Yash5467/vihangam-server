export class ApiError {
  statusCode: number;
  success: boolean;
  message = '';
  constructor(statusCode: number, message: string) {
    this.message = message;
    this.statusCode = statusCode;
    this.success = false;
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

export class ApiResponse<T> {
  data: T;
  message: string;
  success: boolean;
  statusCode: number;

  constructor(data: T, message = 'Success', statusCode = 200) {
    this.data = data;
    this.message = message;
    this.success = true;
    this.statusCode = statusCode;
  }
}