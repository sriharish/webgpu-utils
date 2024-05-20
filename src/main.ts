import { vertexShader, fragmentShader } from "./shaders";

async function initWebGPU(): Promise<any> {
    const gpu = (navigator as any).gpu;

    if(!gpu) {
        return { error: '[WEBGPU][ERROR] WebGPU is not supported in this browser' };
    }

    // Request an adapter
    const adapter = await gpu.requestAdapter();
    if(!adapter) {
        return { error: '[WEBGPU][ERROR] failed to get GPU adapter' };
    }

    //Request a device
    const device = await adapter.requestDevice();
    if(!device) {
        return { error: '[WEBGPU][ERROR] failed to get a gpu for this device' }
    }

    // Get canvas element
    const canvas: HTMLCanvasElement = document.getElementById('gpuCanvas') as HTMLCanvasElement;

    // Get a WebGPU context from the canvas
    const context: RenderingContext = canvas.getContext('webgpu') as RenderingContext;
    if(!context) {
        return { error: '[WEBGPU][ERROR] failed to get WebGPU context' }
    }

    // Configure the context
    const presentationFormat = gpu.getPreferredCanvasFormat();
    (context as any).configure({
        device: device,
        format: presentationFormat
    });

    // Create a render pipeline
    const pipeline = device.createRenderPipeline({
        layout: 'auto',
        vertex: {
            module: device.createShaderModule({
                label: 'our hardcoded red triangle shaders',
                code: vertexShader
            })
        },
        fragment: {
            module: device.createShaderModule({
                code: fragmentShader
            }),
            targets: [
                {
                    format: presentationFormat,
                }
            ]
        },
        primitive: {
            topology: 'triangle-list',
        }
    });

    return { pipeline, device, context, error: '' };
}

function render(pipeline: any, device: any, context: any): void {
    // Create a command encoder
    const commandEncoder = device.createCommandEncoder({ label: 'command encoder' });

    // Create a texture view from the canvas context
    const textureView = context.getCurrentTexture().createView();

    // Begin render pass
    const renderPassDescriptor = {
        label: 'our basic canvas renderPass',
        colorAttachments: [
          {
            view: textureView,
            clearValue: [0.3, 0.3, 0.3, 1],
            loadOp: 'clear',
            storeOp: 'store',
          },
        ],
      };

    const passEncoder = commandEncoder.beginRenderPass(renderPassDescriptor);
    passEncoder.setPipeline(pipeline);
    passEncoder.draw(3);
    passEncoder.end();

    const commandBuffer = commandEncoder.finish();
    device.queue.submit([commandBuffer]);
}

async function main() {
    const { pipeline, device, context, error } = await initWebGPU();
    if(error) {
        console.error(error);
        return;
    }
    render(pipeline, device, context);
}

main();
