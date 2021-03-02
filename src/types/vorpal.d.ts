import Vorpal from 'vorpal';

declare module 'vorpal' {
  namespace Vorpal {
    interface Command {
      description: any;
      autocompletion: (callback: (text: string, iteration: any, cb: Function) => void) => this;
    }
  }
  export = Vorpal;
}
