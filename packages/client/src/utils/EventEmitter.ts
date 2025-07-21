import EventEmitter from "events";

class Emitterclass extends EventEmitter {
  on(event, fn) {
    super.on(event, fn);
  }

  once(event, fn) {
    super.once(event, fn);
  }

  off(event, fn) {
    super.off(event, fn);
  }

  emit(event, payload) {
    super.emit(event, payload);
  }
}

const Emitter = new Emitterclass();

  
  export default Emitter;