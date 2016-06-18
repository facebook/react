import {spawn} from 'child_process';
import {resolve} from 'url';

enum State {
  idle,
  waiting,
  error
}

export const TSC = 'node_modules/typescript/bin/tsc';
export type Command = (stdIn: any, stdErr: any) => Promise<number>;

export class TscWatch {
  private tsconfig: string;
  private start: string|RegExp;
  private error: string|RegExp;
  private complete: string|RegExp;
  private onStartCmds: Array<string[]|Command>;
  private onChangeCmds: Array<string[]|Command>;
  private state: State;
  private triggered: Promise<number> = null;
  private runOnce: boolean = false;

  constructor({tsconfig, start, error, complete, onStartCmds = null, onChangeCmds = null}: {
    tsconfig: string,
    error: string|RegExp,
    start: string,
    complete: string, onStartCmds?: Array<string[]|Command>, onChangeCmds?: Array<string[]|Command>
  }) {
    console.log('Watching:', tsconfig, 'in', process.cwd());
    this.tsconfig = tsconfig;
    this.start = start;
    this.error = error;
    this.complete = complete;
    this.onStartCmds = onStartCmds || [];
    this.onChangeCmds = onChangeCmds || [];
  }

  watch() {
    var args = [TSC, '--emitDecoratorMetadata', '--project', this.tsconfig];
    if (!this.runOnce) args.push('--watch');
    var tsc =
        this.runCmd(args, {}, (d) => this.consumeLine(d, false), (d) => this.consumeLine(d, true));
    if (this.runOnce) {
      tsc.then(() => this.triggerCmds(), code => process.exit(code));
    }
    this.state = State.waiting;
    this.onStartCmds.forEach((cmd) => this.runCmd(cmd, null, () => null, () => null));
  }

  private runCmd(
      argsOrCmd: string[]|Command, env?: {[k: string]: string}, stdOut = pipeStdOut,
      stdErr = pipeStdErr): Promise<number> {
    if (typeof argsOrCmd == 'function') {
      return (argsOrCmd as Command)(stdErr, stdOut);
    } else if (argsOrCmd instanceof Array) {
      var args = argsOrCmd as Array<string>;
      return <any>new Promise((resolve, reject) => {
               var [cmd, ...options] = args;
               console.log('=====>', cmd, options.join(' '));
               var childProcess = spawn(cmd, options, {stdio: 'pipe'});
               childProcess.stdout.on('data', stdOut);
               childProcess.stderr.on('data', stdErr);
               var onExit = () => childProcess.kill();
               childProcess.on('close', (code: number) => {
                 process.removeListener('exit', onExit);
                 console.log('EXIT:', code, '<=====', args.join(' '));
                 code ? reject(code) : resolve(code);
               });
               process.on('exit', onExit);
             })
          .catch(reportError);
    } else {
      throw new Error('Expecting function or an array of strings...');
    }
  }

  run() {
    this.runOnce = true;
    this.watch();
  }

  runCmdsOnly() {
    this.runOnce = true;
    this.triggerCmds();
  }

  consumeLine(buffer: Buffer, isStdError: boolean) {
    var line = '' + buffer;
    if (contains(line, this.start)) {
      console.log('==============================================================================');
      stdOut(buffer, isStdError);
      this.state = State.waiting;
    } else if (contains(line, this.error)) {
      stdOut(buffer, isStdError);
      this.state = State.error;
    } else if (contains(line, this.complete)) {
      stdOut(buffer, isStdError);
      console.log('------------------------------------------------------------------------------');
      if (this.state == State.error) {
        console.log('Errors found.... (response not triggered)');
        if (this.runOnce) process.exit(1);
        this.state = State.idle;
      } else {
        if (this.triggered) {
          this.triggered.then(
              () => this.triggerCmds(),
              (e) => {console.log('Error while running commands....', e)});
        } else {
          this.triggerCmds();
        }
      }
    } else {
      stdOut(buffer, isStdError);
    }
  }

  triggerCmds() {
    var cmdPromise: Promise<number> = Promise.resolve(0);
    this.onChangeCmds.forEach((cmd: string[] | Command) => {cmdPromise = cmdPromise.then(() => {
                                return this.runCmd(<string[]>cmd);
                              })});
    cmdPromise.then(() => this.triggered = null, (code) => {
      if (this.runOnce) {
        if (typeof code != 'number') {
          console.error('Error occurred while executing commands', code);
          process.exit(1);
        }
        process.exit(code);
      } else {
        this.triggered = null;
      }
    });
    this.triggered = cmdPromise;
  }
}

function stdOut(data: Buffer, isStdError: boolean) {
  if (isStdError) {
    process.stderr.write(data);
  } else {
    process.stdout.write(data);
  }
}

function contains(line: string, text: string | RegExp): boolean {
  if (typeof text == 'string') {
    return line.indexOf(text as string) != -1;
  } else if (text instanceof RegExp) {
    return (text as RegExp).test(line);
  } else {
    throw new Error('Unknown: ' + text);
  }
}

export function reportError(e: any) {
  if (e.message && e.stack) {
    console.error(e.message);
    console.error(e.stack);
  } else {
    console.error(e);
  }
  // process.exit(1);
  return Promise.reject(e);
}

function pipeStdOut(d: any) {
  process.stdout.write(d);
}
function pipeStdErr(d: any) {
  process.stderr.write(d);
}
