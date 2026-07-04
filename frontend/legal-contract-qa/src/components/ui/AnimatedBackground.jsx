import { useEffect, useRef } from 'react';

export default function AnimatedBackground() {
    const blob1Ref = useRef(null);
    const blob2Ref = useRef(null);
    const blob3Ref = useRef(null);

    useEffect(() => {
        const blobs = [blob1Ref.current, blob2Ref.current, blob3Ref.current];
        let animationId;

        const positions = blobs.map(() => ({
            x: Math.random() * 100,
            y: Math.random() * 100,
            vx: (Math.random() - 0.5) * 0.3,
            vy: (Math.random() - 0.5) * 0.3,
        }));

        function animate() {
            positions.forEach((pos, i) => {
                pos.x += pos.vx;
                pos.y += pos.vy;

                if (pos.x < 0 || pos.x > 100) pos.vx *= -1;
                if (pos.y < 0 || pos.y > 100) pos.vy *= -1;

                if (blobs[i]) {
                    blobs[i].style.transform = `translate(${pos.x - 50}%, ${pos.y - 50}%)`;
                }
            });

            animationId = requestAnimationFrame(animate);
        }

        animate();
        return () => cancelAnimationFrame(animationId);
    }, []);

    return (
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
            {/* Gradient blobs */}
            <div
                ref={blob1Ref}
                className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full opacity-20"
                style={{
                    background: 'radial-gradient(circle, rgba(79,70,229,0.4) 0%, transparent 70%)',
                    filter: 'blur(80px)',
                }}
            />
            <div
                ref={blob2Ref}
                className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full opacity-15"
                style={{
                    background: 'radial-gradient(circle, rgba(6,182,212,0.4) 0%, transparent 70%)',
                    filter: 'blur(80px)',
                }}
            />
            <div
                ref={blob3Ref}
                className="absolute top-[40%] left-[60%] w-[400px] h-[400px] rounded-full opacity-10"
                style={{
                    background: 'radial-gradient(circle, rgba(124,58,237,0.4) 0%, transparent 70%)',
                    filter: 'blur(80px)',
                }}
            />

            {/* Grid pattern overlay */}
            <div
                className="absolute inset-0 opacity-[0.03]"
                style={{
                    backgroundImage:
                        'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
                    backgroundSize: '60px 60px',
                }}
            />
        </div>
    );
}