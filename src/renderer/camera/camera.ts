import { vec3, mat4 } from 'gl-matrix';

export default abstract class Camera {
  eye = vec3.create();

  view = mat4.create();

  yfov?: number;

  ymag?: number;

  proj = mat4.create();

  projView = mat4.create();

  projViewBuffer: GPUBuffer;

  eyeBuffer: GPUBuffer;

  bindGroup: GPUBindGroup;

  canvas: HTMLCanvasElement;

  needUpdate = true;

  constructor(
    projViewBuffer: GPUBuffer,
    eyeBuffer: GPUBuffer,
    bindGroup: GPUBindGroup,
    canvas: HTMLCanvasElement
  ) {
    this.projViewBuffer = projViewBuffer;
    this.eyeBuffer = eyeBuffer;
    this.bindGroup = bindGroup;
    this.canvas = canvas;

    window.addEventListener('resize', () => {
      const newAspect = canvas.clientWidth / canvas.clientHeight;
      if (this.ymag === undefined) {
        this.proj[0] = 1 / (Math.tan(this.yfov! / 2) * newAspect);
      } else {
        this.proj[0] = 1 / (this.ymag * newAspect);
      }
      this.needUpdate = true;
    });
  }

  abstract updateView(): void;

  update(device: GPUDevice, passEncoder: GPURenderPassEncoder) {
    if (this.needUpdate) {
      this.updateView();
      mat4.mul(this.projView, this.proj, this.view);

      const projView = this.projView as Float32Array;
      device.queue.writeBuffer(
        this.projViewBuffer,
        0,
        projView.buffer,
        projView.byteOffset,
        projView.byteLength
      );
      const eye = this.eye as Float32Array;
      device.queue.writeBuffer(
        this.eyeBuffer,
        0,
        eye.buffer,
        eye.byteOffset,
        eye.byteLength
      );

      this.needUpdate = false;
    }

    passEncoder.setBindGroup(0, this.bindGroup);
  }

  destroy() {
    this.projViewBuffer.destroy();
    this.eyeBuffer.destroy();
  }
}
