import Primitive from '../renderer/primitive';

export default function vert(primitive: Primitive, instanceCount: number) {
  const hasUV = primitive.uvs !== null;
  const hasUV1 = primitive.uv1s !== null;
  const hasTangent = primitive.tangents !== null;
  const hasVertexColor = primitive.colors !== null;

  let inLocation = 1;
  let outLocation = 1;

  /* eslint-disable no-return-assign */

  return /* wgsl */ `

struct Camera
  {
      projView: mat4x4<f32>,
  };
  @group(0) @binding(0) var<uniform> camera: Camera;

  struct Model {
      matrix: mat4x4<f32>,
      invTr: mat4x4<f32>,
  };
 struct Models
  {
      model: array<Model, ${instanceCount}>,
  };
  @group(1)  @binding(0) var<uniform> models: Models;

  struct VertexOutput
  {
      @builtin(position) position: vec4<f32>,
      @location(0) normal: vec3<f32>,
      @location(1) worldPos: vec3<f32>,
      ${
        hasUV
          ? `@location(${(outLocation += 1)}) uv: vec2<f32>, /* wgsl */`
          : ''
      }
      ${
        hasUV1
          ? `@location(${(outLocation += 1)}) uv1: vec2<f32>, /* wgsl */`
          : ''
      }
      ${
        hasTangent
          ? `@location(${(outLocation += 1)}) tangent: vec3<f32>,
             @location(${(outLocation += 1)}) bitangent: vec3<f32>, /* wgsl */`
          : ''
      }
      ${
        hasVertexColor
          ? `@location(${(outLocation += 1)}) color: vec4<f32>, /* wgsl */`
          : ''
      }
  };

  @vertex
  fn main(@builtin(instance_index) instanceIndex : u32,
          @location(0) pos: vec3<f32>,
          @location(1) normal: vec3<f32>,
          ${
            hasUV
              ? `@location(${(inLocation += 1)}) uv: vec2<f32>, /* wgsl */`
              : ''
          }
          ${
            hasUV1
              ? `@location(${(inLocation += 1)}) uv1: vec2<f32>, /* wgsl */`
              : ''
          }
          ${
            hasTangent
              ? `@location(${(inLocation += 1)}) tangent: vec4<f32>, /* wgsl */`
              : ''
          }
          ${
            hasVertexColor
              ? `@location(${(inLocation += 1)}) color: vec4<f32>, /* wgsl */`
              : ''
          }) -> VertexOutput
  {
      let model = models.model[instanceIndex];
      var v: VertexOutput;
      v.position = camera.projView * model.matrix * vec4<f32>(pos, 1.0);
      v.normal = normalize((model.invTr * vec4<f32>(normal, 0.0)).xyz);
      v.worldPos = (model.matrix * vec4<f32>(pos, 1.0)).xyz;
      ${hasUV ? 'v.uv = uv;' : ''}
      ${hasUV1 ? 'v.uv1 = uv1;' : ''}
      ${
        hasTangent
          ? `v.tangent = normalize((model.matrix * vec4<f32>(tangent.xyz, 0.0)).xyz);
             v.bitangent = cross(v.normal, v.tangent) * tangent.w; /* wgsl */`
          : ''
      }
      ${hasVertexColor ? 'v.color = color;' : ''}
      return v;
  }`;
}
