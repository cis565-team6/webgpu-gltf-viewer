import { mat4, vec3 } from 'gl-matrix';
import { clamp } from '../../util';
import Camera from './camera';

const up = vec3.fromValues(0, 1, 0);

export default class UserCamera extends Camera {
  radius = 3;

  theta = 0;

  phi = 0;

  center = vec3.create();

  canvas: HTMLCanvasElement;

  mousePressed = false;

  constructor(
    projViewBuffer: GPUBuffer,
    eyeBuffer: GPUBuffer,
    bindGroup: GPUBindGroup,
    canvas: HTMLCanvasElement,
    aabb: { max: vec3; min: vec3 }
  ) {
    super(projViewBuffer, eyeBuffer, bindGroup, canvas);
    this.canvas = canvas;

    this.reset(aabb);

    let mousePressed = false;
    canvas.onmousedown = (event) => {
      event.preventDefault();
      mousePressed = true;
    };
    canvas.onmouseup = (event) => {
      event.preventDefault();
      mousePressed = false;
    };
    canvas.onmousemove = (event) => {
      event.preventDefault();
      if (mousePressed) {
        this.theta! -= (event.movementX / window.innerWidth) * Math.PI * 2;
        this.phi = clamp(
          this.phi! - (event.movementY / window.innerHeight) * Math.PI,
          -Math.PI / 2 + 0.1,
          Math.PI / 2 - 0.1
        );
        this.needUpdate = true;
      }
    };
  }

  reset(aabb: { max: vec3; min: vec3 }) {
    this.center = vec3.create();
    vec3.scale(this.center, vec3.add(this.center, aabb.max, aabb.min), 0.5);

    const diagonal = vec3.create();
    const radius = vec3.len(vec3.sub(diagonal, aabb.max, aabb.min));
    this.radius = radius;

    this.theta = 0;
    this.phi = 0;
    this.yfov = Math.PI / 3;

    const aspect = this.canvas.clientWidth / this.canvas.clientHeight;
    mat4.perspective(this.proj, this.yfov, aspect, radius / 100, Infinity);

    this.canvas.onwheel = (event) => {
      event.preventDefault();
      this.radius = clamp(
        this.radius! + event.deltaY * 0.001 * radius,
        radius / 16,
        Infinity
      );
      this.needUpdate = true;
    };

    this.needUpdate = true;
  }

  updateView() {
    this.eye = vec3.fromValues(
      this.center[0],
      this.center[1],
      this.center[2] + this.radius
    );
    vec3.rotateX(this.eye, this.eye, this.center, this.phi);
    vec3.rotateY(this.eye, this.eye, this.center, this.theta);
    mat4.lookAt(this.view, this.eye, this.center, up);
  }
}
