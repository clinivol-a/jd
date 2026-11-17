import { useEffect, useRef, useState } from 'react';
import { Alert } from 'tdesign-react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
export type PreviewModel = {
    positions: number[];
    indices: number[];
    kind: string;
    variant: number;
    resultKey: string;
};
export function ReadOnlyModel({ model,onReady }: {
    model: PreviewModel;onReady?:()=>void;
}) {
    const host = useRef<HTMLDivElement>(null), [error, setError] = useState('');
    useEffect(() => {
        const el = host.current;
        if (!el)
            return;
        let renderer: THREE.WebGLRenderer;
        try {
            renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
        }
        catch {
            setError('当前设备无法启动三维视图，请使用支持WebGL的浏览器。');
            return;
        }
        renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
        renderer.setClearColor(0xffffff);
        el.append(renderer.domElement);
        const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(35, 1, .1, 5000), geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(model.positions, 3));
        geometry.setIndex(model.indices);
        geometry.computeVertexNormals();
        geometry.computeBoundingSphere();
        const center = geometry.boundingSphere!.center;
        geometry.translate(-center.x, -center.y, -center.z);
        const material = new THREE.MeshStandardMaterial({ color: 0xe3d7bc, roughness: .85, metalness: 0, side: THREE.DoubleSide }), mesh = new THREE.Mesh(geometry, material);
        scene.add(mesh);
        scene.add(new THREE.HemisphereLight(0xffffff, 0x8d9296, 2.6));
        const light = new THREE.DirectionalLight(0xffffff, 1.4);
        light.position.set(100, 120, 200);
        scene.add(light);
        const radius = geometry.boundingSphere!.radius;
        camera.up.set(0, 0, 1);
        camera.position.set(radius * (1.2 + model.variant), -radius * 2.7, radius * (.8 + model.variant * .5));
        camera.lookAt(0, 0, 0);
        // CAD fixture adds a read-only display plate, never an editable engineering artifact.
        let plate: THREE.Mesh | undefined;
        if (model.kind === 'cad') {
            const g = new THREE.TorusGeometry(radius * .52, radius * .035, 8, 28, Math.PI * .9), m = new THREE.MeshStandardMaterial({ color: 0x518caf, roughness: .5, metalness: .25 });
            plate = new THREE.Mesh(g, m);
            plate.rotation.z = Math.PI * .55;
            plate.position.set(0, -radius * .15, -radius * .23);
            scene.add(plate);
        }
        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = false;
        const render = () => renderer.render(scene, camera);
        controls.addEventListener('change', render);
        const resize = new ResizeObserver(() => { camera.aspect = el.clientWidth / Math.max(el.clientHeight, 1); camera.position.setLength(radius / Math.sin(THREE.MathUtils.degToRad(camera.fov / 2)) * Math.max(1, 1 / camera.aspect) * 1.08); camera.updateProjectionMatrix(); renderer.setSize(el.clientWidth, el.clientHeight); render(); });
        resize.observe(el);
        render();
        onReady?.();
        return () => { resize.disconnect(); controls.removeEventListener('change', render); controls.dispose(); geometry.dispose(); material.dispose(); if (plate) {
            plate.geometry.dispose();
            (plate.material as THREE.Material).dispose();
        } renderer.dispose(); renderer.domElement.remove(); };
    }, [model,onReady]);
    return <>{error && <Alert theme="error" message={error}/>}<div ref={host} className="business-model-viewer" aria-label="只读三维成果，可旋转平移和缩放"/></>;
}
