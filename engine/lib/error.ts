export class RunixError extends Error {
  constructor(
    public statusCode: number,
    message: string
  ) {
    super(message);
    this.name = "RunixError";
  }
}

export class ValidationError extends RunixError {
  constructor(message: string) {
    super(400, message);
    this.name = "ValidationError";
  }
}

export class NotFoundError extends RunixError {
  constructor(message: string) {
    super(404, message);
    this.name = "NotFoundError";
  }
}

export class TimeoutError extends RunixError {
  constructor(message: string) {
    super(408, message);
    this.name = "TimeoutError";
  }
}

export class ExecutionError extends RunixError {
  constructor(message: string) {
    super(500, message);
    this.name = "ExecutionError";
  }
}