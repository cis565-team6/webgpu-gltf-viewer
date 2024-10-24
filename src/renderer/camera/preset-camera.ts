import { mat4, vec3, vec4 } from 'gl-matrix';
import Camera from './camera';

export default class PresetCamera extends Camera {
  globalTransform: mat4;

  constructor(
    projViewBuffer: GPUBuffer,
    eyeBuffer: GPUBuffer,
    bindGroup: GPUBindGroup,
    canvas: HTMLCanvasElement,
    globalTransform: mat4,
    json: any
  ) {
    super(projViewBuffer, eyeBuffer, bindGroup, canvas);
    this.globalTransform = globalTransform;

    const aspect = canvas.clientWidth / canvas.clientHeight;
    if (json.type === 'perspective') {
      const { yfov, zfar, znear } = json.perspective;
      this.yfov = yfov;
      mat4.perspective(this.proj, yfov, aspect, znear, zfar || Infinity);
    } else {
      const { ymag, zfar, znear } = json.orthographic;
      this.ymag = ymag;
      this.proj[0] = 1 / (ymag * aspect);
      this.proj[5] = 1 / ymag;
      this.proj[10] = 1 / (znear - zfar);
      this.proj[14] = znear / (znear - zfar);
    }
  }

  updateView() {
    const e = vec3.create();
    this.eye = vec4.create();
    vec3.transformMat4(e, e, this.globalTransform);
    vec4.set(this.eye, e[0], e[1], e[2], 0);
    mat4.invert(this.view, this.globalTransform);
  }
}
