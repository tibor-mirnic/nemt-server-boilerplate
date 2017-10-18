export interface IErrorBase {
  name: string;
  message: string;
  displayMessage: string;
}

export class ErrorBase extends Error {
  public name: string;
  public message: string;

  constructor(message = 'Error Base Message', name = 'Error Base') {
    super(message);
    
    this.name = name;
    this.message = message;
  }

  toJSON(): IErrorBase {
    return {
      name: this.name,
      message: this.message,
      displayMessage: `${this.name}: ${this.message}`
    }
  }

  prettify(): string {
    return `${this.name}: ${this.message}.`;
  }
}