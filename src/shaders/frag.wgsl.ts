import Primitive from '../renderer/primitive';
import { toFloat } from '../util';

export default function frag(primitive: Primitive, material: any) {
  const hasUV = primitive.uvs !== null;
  const hasUV1 = primitive.uv1s !== null;
  const hasTangent = primitive.tangents !== null;
  const hasVertexColor = primitive.colors !== null;

  const {
    baseColorTexture,
    metallicRoughnessTexture,
    metallicFactor,
    roughnessFactor,
  } = material.pbrMetallicRoughness;
  const { normalTexture, occlusionTexture, emissiveTexture } = material;
  let { baseColorFactor } = material.pbrMetallicRoughness;
  baseColorFactor = baseColorFactor || [1, 1, 1, 1];
  let { emissiveFactor } = material;
  emissiveFactor = emissiveFactor || [0, 0, 0];

  const colorUV = baseColorTexture?.texCoord || '';
  const pbrUV = metallicRoughnessTexture?.texCoord || '';
  const normalUV = normalTexture?.texCoord || '';
  const aoUV = occlusionTexture?.texCoord || '';
  const emissiveUV = emissiveTexture?.texCoord || '';

  let location = 1;

  /* eslint-disable no-return-assign */

  return /* wgsl */ `

  struct Camera
  {
      eye: vec4<f32>,
  };
  @group(0) @binding(1) var<uniform> camera: Camera;

  ${
    baseColorTexture
      ? `@group(1) @binding(1) var texSampler: sampler;
         @group(1) @binding(2) var tex: texture_2d<f32>; /* wgsl */`
      : ''
  }
  ${
    metallicRoughnessTexture
      ? `@group(1) @binding(3) var metalRoughSampler: sampler;
         @group(1) @binding(4) var metalRoughTex: texture_2d<f32>; /* wgsl */`
      : ''
  }
  ${
    normalTexture
      ? `@group(1) @binding(5) var normalSampler: sampler;
         @group(1) @binding(6) var normalTex: texture_2d<f32>; /* wgsl */`
      : ''
  }
  ${
    occlusionTexture
      ? `@group(1) @binding(7) var occlusionSampler: sampler;
         @group(1) @binding(8) var occlusionTex: texture_2d<f32>; /* wgsl */`
      : ''
  }
  ${
    emissiveTexture
      ? `@group(1) @binding(9) var emissiveSampler: sampler;
         @group(1) @binding(10) var emissiveTex: texture_2d<f32>; /* wgsl */`
      : ''
  }

  fn linearSample(texture: texture_2d<f32>, texSampler: sampler, uv: vec2<f32>) -> vec4<f32>
  {
    let color = textureSample(texture, texSampler, uv);
    return vec4<f32>(pow(color.rgb, vec3<f32>(2.2)), color.a);
  }

  const pi: f32 = 3.141592653589793;

  fn blinnPhong(color: vec3<f32>,
           l: vec3<f32>,
           v: vec3<f32>,
           n: vec3<f32>) -> vec3<f32>
  {
      let specExp = 64.0;
      let intensity = 0.5;
      let ambient = 0.5;

      let diffuse = max(dot(n, l), 0.0);
      let specular = pow(max(dot(n, normalize(l + v)), 0.0), specExp);

      return color * ((diffuse + specular) * intensity + ambient);
  }

  fn brdf(color: vec3<f32>,
          metallic: f32,
          roughness: f32,
          l: vec3<f32>,
          v: vec3<f32>,
          n: vec3<f32>) -> vec3<f32>
  {
      let h = normalize(l + v);
      let ndotl = clamp(dot(n, l), 0.0, 1.0);
      let ndotv = abs(dot(n, v));
      let ndoth = clamp(dot(n, h), 0.0, 1.0);
      let vdoth = clamp(dot(v, h), 0.0, 1.0);

      let f0 = vec3<f32>(0.04);
      let diffuseColor = color * (1.0 - f0) * (1.0 - metallic);
      let specularColor = mix(f0, color, metallic);

      let reflectance = max(max(specularColor.r, specularColor.g), specularColor.b);
      let reflectance0 = specularColor;
      let reflectance9 = vec3<f32>(clamp(reflectance * 25.0, 0.0, 1.0));
      let f = reflectance0 + (reflectance9 - reflectance0) * pow(1.0 - vdoth, 5.0);

      let r2 = roughness * roughness;
      let r4 = r2 * r2;
      let attenuationL = 2.0 * ndotl / (ndotl + sqrt(r4 + (1.0 - r4) * ndotl * ndotl));
      let attenuationV = 2.0 * ndotv / (ndotv + sqrt(r4 + (1.0 - r4) * ndotv * ndotv));
      let g = attenuationL * attenuationV;

      let temp = ndoth * ndoth * (r2 - 1.0) + 1.0;
      let d = r2 / (pi * temp * temp);

      let diffuse = (1.0 - f) / pi * diffuseColor;
      let specular = max(f * g * d / (4.0 * ndotl * ndotv), vec3<f32>(0.0));
      return ndotl * (diffuse + specular) * 2.0 + color * 0.1;
  }

  @fragment
  fn main(@location(0) vNormal: vec3<f32>,
          @location(1) worldPos: vec3<f32>,
          ${
            hasUV
              ? `@location(${(location += 1)}) uv: vec2<f32>, /* wgsl */`
              : ''
          }
          ${
            hasUV1
              ? `@location(${(location += 1)}) uv1: vec2<f32>, /* wgsl */`
              : ''
          }
          ${
            hasTangent
              ? `@location(${(location += 1)}) tangent: vec3<f32>,
                 @location(${(location += 1)}) bitangent: vec3<f32>, /* wgsl */`
              : ''
          }
          ${
            hasVertexColor
              ? `@location(${(location += 1)}) vColor: vec4<f32>, /* wgsl */`
              : ''
          }) -> @location(0) vec4<f32>
  {
      let lightDir = normalize(vec3<f32>(2.0, 4.0, 3.0));

      var color = vec4<f32>(${toFloat(baseColorFactor[0])},
                            ${toFloat(baseColorFactor[1])},
                            ${toFloat(baseColorFactor[2])},
                            ${toFloat(baseColorFactor[3])});
      ${
        baseColorTexture
          ? `color = color * linearSample(tex, texSampler, uv${colorUV}); /* wgsl */`
          : ''
      }
      ${hasVertexColor ? 'color = color * vColor;' : ''}

      ${
        material.alphaMode === 'MASK'
          ? `if (color.a < ${toFloat(material.alphaCutoff, 0.5)})
             {
               discard;
             } /* wgsl */`
          : ''
      }

      var metallic: f32 = ${toFloat(metallicFactor)};
      var roughness: f32 = ${toFloat(roughnessFactor)};
      ${
        metallicRoughnessTexture
          ? `let metalRough = textureSample(metalRoughTex, metalRoughSampler, uv${pbrUV});
             metallic = metallic * metalRough.b;
             roughness = roughness * metalRough.g; /* wgsl */`
          : ''
      }
      roughness = clamp(roughness, 0.04, 1.0);

      ${
        normalTexture
          ? `var normal = textureSample(normalTex, normalSampler, uv${normalUV}).rgb;
             normal = normal * 2.0 - 1.0;
             normal.x = normal.x * ${toFloat(normalTexture.scale)};
             normal.y = normal.y * ${toFloat(normalTexture.scale)};
             normal = normal.x * tangent + normal.y * bitangent + normal.z * vNormal;
             normal = normalize(normal); /* wgsl */`
          : `var normal = normalize(vNormal); /* wgsl */`
      }

      ${
        occlusionTexture
          ? `var ao = textureSample(occlusionTex, occlusionSampler, uv${aoUV}).r;
             ao = 1.0 + ${toFloat(occlusionTexture.strength)} * (ao - 1.0);
             /* wgsl */`
          : 'let ao = 1.0;'
      }
      var emissive = vec3<f32>(${toFloat(emissiveFactor[0])},
                               ${toFloat(emissiveFactor[1])},
                               ${toFloat(emissiveFactor[2])});
      ${
        emissiveTexture
          ? `emissive = emissive * linearSample(emissiveTex, emissiveSampler, uv${emissiveUV}).rgb; /* wgsl */`
          : ''
      }

      let viewDir = normalize(camera.eye.xyz - worldPos);
      ${
        material.doubleSided
          ? `if (dot(normal, viewDir) < 0.0)
             {
               normal = -normal;
             } /* wgsl */`
          : ''
      }

      var rgb = brdf(color.rgb, metallic, roughness, lightDir, viewDir, normal) * ao + emissive;
      rgb = pow(rgb, vec3<f32>(1.0 / 2.2));
      return vec4<f32>(rgb, color.a);
  }`;
}
