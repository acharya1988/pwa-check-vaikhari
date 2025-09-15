export class Router {
  constructor() {
    this.routes = new Map();
  }
  key(m, p) {
    return `${m.toUpperCase()} ${p}`;
  }
  on(method, path, handler) {
    this.routes.set(this.key(method, path), handler);
  }
  match(method, path) {
    return this.routes.get(this.key(method, path));
  }
}

