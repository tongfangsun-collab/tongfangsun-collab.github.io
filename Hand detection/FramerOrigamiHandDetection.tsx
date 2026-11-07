import React, { useEffect, useRef, useState } from "react"
import { addPropertyControls, ControlType } from "framer"

const STEPS = [
    {
        stepNum: 1,
        fingers: 0,
        icon: "✊",
        gestureText: "0 Fingers (Rock)",
        title: "Flat Origami Sheet",
        progress: 0.0,
    },
    {
        stepNum: 2,
        fingers: 1,
        icon: "☝️",
        gestureText: "1 Finger",
        title: "Geometric Base Fold",
        progress: 0.2,
    },
    {
        stepNum: 3,
        fingers: 2,
        icon: "✌️",
        gestureText: "2 Fingers",
        title: "Ears & Torso Fold",
        progress: 0.4,
    },
    {
        stepNum: 4,
        fingers: 3,
        icon: "🤟",
        gestureText: "3 Fingers",
        title: "Eyes & Red Cheeks",
        progress: 0.6,
    },
    {
        stepNum: 5,
        fingers: 4,
        icon: "🖖",
        gestureText: "4 Fingers",
        title: "Lightning Bolt Tail",
        progress: 0.77,
    },
    {
        stepNum: 6,
        fingers: 5,
        icon: "🖐️",
        gestureText: "5 Fingers (Paper)",
        title: "Pikachu Waving!",
        progress: 0.98,
    },
]

interface Props {
    videoFile: string
    step1Image?: string
    step2Image?: string
    step3Image?: string
    step4Image?: string
    step5Image?: string
    step6Image?: string
    showBottomDock: boolean
    borderRadius: number
}

export default function FramerOrigamiHandDetection(props: Props) {
    const {
        videoFile,
        step1Image,
        step2Image,
        step3Image,
        step4Image,
        step5Image,
        step6Image,
        showBottomDock = true,
        borderRadius = 20,
    } = props

    const containerRef = useRef<HTMLDivElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const webcamRef = useRef<HTMLVideoElement>(null)
    const sourceVideoRef = useRef<HTMLVideoElement>(null)

    const [activeStep, setActiveStep] = useState(0)
    const [cameraStatus, setCameraStatus] = useState("Click 'Start Camera' to control with hand")
    const [cameraReady, setCameraReady] = useState(false)
    const [hudVisible, setHudVisible] = useState(showBottomDock)
    const [zoomPct, setZoomPct] = useState(100)
    const [extractedThumbs, setExtractedThumbs] = useState<string[]>([])

    // Mutable animation state refs for 60fps loop
    const stateRef = useRef({
        currentProgress: 0,
        targetProgress: 0,
        currentZoom: 1,
        targetZoom: 1,
        frames: [] as HTMLCanvasElement[],
        framesReady: false,
        stepImgs: [] as (HTMLImageElement | null)[],
    })

    // Load optional step images if provided
    useEffect(() => {
        const urls = [step1Image, step2Image, step3Image, step4Image, step5Image, step6Image]
        stateRef.current.stepImgs = urls.map((u) => {
            if (!u) return null
            const img = new Image()
            img.crossOrigin = "anonymous"
            img.src = u
            return img
        })
    }, [step1Image, step2Image, step3Image, step4Image, step5Image, step6Image])

    // Decode uploaded videoFile into smooth in-memory canvas frames (90 frames) for instant forward/backward scrubbing
    useEffect(() => {
        if (!videoFile) return
        let cancelled = false

        const vid = document.createElement("video")
        vid.src = videoFile
        vid.crossOrigin = "anonymous"
        vid.muted = true
        vid.playsInline = true
        vid.preload = "auto"

        const extractFrames = async () => {
            try {
                await new Promise<void>((resolve, reject) => {
                    vid.onloadedmetadata = () => resolve()
                    vid.onerror = (e) => reject(e)
                })

                const duration = vid.duration || 10
                const totalFrames = 90
                const vw = vid.videoWidth || 720
                const vh = vid.videoHeight || 1280
                const decoded: HTMLCanvasElement[] = []
                const thumbs: string[] = []

                for (let i = 0; i < totalFrames; i++) {
                    if (cancelled) return
                    const t = (i / (totalFrames - 1)) * Math.max(0.1, duration - 0.08)
                    vid.currentTime = t
                    await new Promise<void>((res) => {
                        const onSeek = () => {
                            vid.removeEventListener("seeked", onSeek)
                            res()
                        }
                        vid.addEventListener("seeked", onSeek)
                    })

                    const c = document.createElement("canvas")
                    c.width = vw
                    c.height = vh
                    const cctx = c.getContext("2d")
                    if (cctx) cctx.drawImage(vid, 0, 0, vw, vh)
                    decoded.push(c)
                }

                // Generate 6 step thumbnails automatically from the video if not manually uploaded
                STEPS.forEach((s) => {
                    const idx = Math.min(
                        decoded.length - 1,
                        Math.round(s.progress * (decoded.length - 1))
                    )
                    if (decoded[idx]) {
                        thumbs.push(decoded[idx].toDataURL("image/jpeg", 0.75))
                    }
                })

                if (!cancelled) {
                    stateRef.current.frames = decoded
                    stateRef.current.framesReady = true
                    setExtractedThumbs(thumbs)
                }
            } catch (err) {
                console.warn("Video frame extraction fallback:", err)
            }
        }

        extractFrames()
        return () => {
            cancelled = true
        }
    }, [videoFile])

    const goToStep = (stepIdx: number) => {
        const clamped = Math.max(0, Math.min(5, stepIdx))
        setActiveStep(clamped)
        stateRef.current.targetProgress = STEPS[clamped].progress
    }

    // Main Render & MediaPipe Loop
    useEffect(() => {
        let animId = 0
        let handLandmarker: any = null
        let lastVideoTime = -1
        let candidateStep: number | null = null
        let holdFrames = 0
        let twoHandAnchorDist: number | null = null
        let twoHandAnchorZoom = 1.0
        let twoHandActiveFrames = 0
        let lastTwoHandTimestamp = 0

        const subjectCanvas = document.createElement("canvas")
        const subjectCtx = subjectCanvas.getContext("2d")

        // Dynamically load MediaPipe Tasks Vision from CDN
        const loadMediaPipe = async () => {
            try {
                const visionModule = await import(
                    /* webpackIgnore: true */
                    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14"
                )
                const { HandLandmarker, FilesetResolver } = visionModule
                const vision = await FilesetResolver.forVisionTasks(
                    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm"
                )
                handLandmarker = await HandLandmarker.createFromOptions(vision, {
                    baseOptions: {
                        modelAssetPath:
                            "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
                        delegate: "GPU",
                    },
                    runningMode: "VIDEO",
                    numHands: 2,
                    minHandDetectionConfidence: 0.55,
                    minHandPresenceConfidence: 0.55,
                    minTrackingConfidence: 0.55,
                })
                // Try auto-starting camera
                startCamera()
            } catch (err) {
                console.warn("MediaPipe load error:", err)
                setCameraStatus("Failed to load MediaPipe model")
            }
        }

        const startCamera = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: { width: 640, height: 480, facingMode: "user" },
                })
                if (webcamRef.current) {
                    webcamRef.current.srcObject = stream
                    setCameraReady(true)
                    setCameraStatus("Camera Ready (0–5 Fingers)")
                }
            } catch {
                setCameraStatus("Click to Enable Camera")
            }
        }

        const dist2D = (a: any, b: any) => Math.hypot(a.x - b.x, a.y - b.y)

        const isMainFingerExtended = (lm: any[], tip: number, pip: number, mcp: number) => {
            const w = lm[0]
            return dist2D(lm[tip], w) > dist2D(lm[pip], w) * 1.07 && dist2D(lm[tip], w) > dist2D(lm[mcp], w) * 1.18
        }

        const countFingers0To5 = (lm: any[]) => {
            const idx = isMainFingerExtended(lm, 8, 6, 5)
            const mid = isMainFingerExtended(lm, 12, 10, 9)
            const rng = isMainFingerExtended(lm, 16, 14, 13)
            const pnk = isMainFingerExtended(lm, 20, 18, 17)
            const mainCount = [idx, mid, rng, pnk].filter(Boolean).length

            const palmW = Math.max(0.05, dist2D(lm[5], lm[17]))
            const thumbToPinky = dist2D(lm[4], lm[17])
            const thumbMcpToPinky = dist2D(lm[2], lm[17])
            const thumbToIndex = dist2D(lm[4], lm[5])
            const thumbToMid = dist2D(lm[4], lm[9])

            const thumbExt =
                thumbToPinky > thumbMcpToPinky * 1.16 &&
                thumbToIndex > palmW * 0.52 &&
                thumbToMid > palmW * 0.62

            if (mainCount === 0) {
                const thumbVeryOut =
                    thumbToPinky > thumbMcpToPinky * 1.32 && thumbToIndex > palmW * 0.78
                return thumbVeryOut ? 1 : 0
            }
            if (mainCount <= 3) return mainCount
            return thumbExt ? 5 : 4
        }

        const drawImmersive = (
            ctx: CanvasRenderingContext2D,
            viewW: number,
            viewH: number,
            srcA: CanvasImageSource | null,
            srcB: CanvasImageSource | null,
            wA: number,
            hA: number,
            blend: number,
            zoom: number
        ) => {
            if (!srcA || wA === 0 || hA === 0) return
            const imgAspect = wA / hA
            const screenAspect = viewW / viewH
            const baseH = Math.max(viewH, viewH * zoom)
            const baseY = (viewH - baseH) / 2
            const pad = 42

            ctx.save()
            ctx.filter = "blur(24px)"
            ctx.drawImage(srcA, -pad, baseY - pad, viewW + pad * 2, baseH + pad * 2)
            if (srcB && blend > 0.01) {
                ctx.globalAlpha = blend
                ctx.drawImage(srcB, -pad, baseY - pad, viewW + pad * 2, baseH + pad * 2)
            }
            ctx.restore()

            let subH: number, subW: number
            if (screenAspect <= imgAspect * 1.15) {
                const scale = Math.max(viewW / wA, viewH / hA) * zoom
                subW = wA * scale
                subH = hA * scale
            } else {
                subH = viewH * 1.04 * zoom
                subW = subH * imgAspect
            }

            const subX = (viewW - subW) / 2
            const subY = (viewH - subH) / 2

            if (subW >= viewW * 0.99 && subH >= viewH * 0.99) {
                ctx.save()
                ctx.drawImage(srcA, subX, subY, subW, subH)
                if (srcB && blend > 0.01) {
                    ctx.globalAlpha = blend
                    ctx.drawImage(srcB, subX, subY, subW, subH)
                }
                ctx.restore()
                return
            }

            const cw = Math.max(1, Math.round(subW))
            const ch = Math.max(1, Math.round(subH))
            if (subjectCanvas.width !== cw || subjectCanvas.height !== ch) {
                subjectCanvas.width = cw
                subjectCanvas.height = ch
            }
            if (!subjectCtx) return

            subjectCtx.clearRect(0, 0, cw, ch)
            subjectCtx.globalCompositeOperation = "source-over"
            subjectCtx.globalAlpha = 1
            subjectCtx.drawImage(srcA, 0, 0, cw, ch)
            if (srcB && blend > 0.01) {
                subjectCtx.globalAlpha = blend
                subjectCtx.drawImage(srcB, 0, 0, cw, ch)
            }

            subjectCtx.globalCompositeOperation = "destination-in"
            subjectCtx.globalAlpha = 1
            const hGrad = subjectCtx.createLinearGradient(0, 0, cw, 0)
            hGrad.addColorStop(0, "rgba(0,0,0,0)")
            hGrad.addColorStop(0.14, "rgba(0,0,0,1)")
            hGrad.addColorStop(0.86, "rgba(0,0,0,1)")
            hGrad.addColorStop(1, "rgba(0,0,0,0)")
            subjectCtx.fillStyle = hGrad
            subjectCtx.fillRect(0, 0, cw, ch)

            ctx.drawImage(subjectCanvas, subX, subY, subW, subH)
        }

        const tick = (now: number) => {
            const vid = webcamRef.current
            if (
                handLandmarker &&
                vid &&
                vid.readyState >= 2 &&
                lastVideoTime !== vid.currentTime &&
                vid.videoWidth > 0
            ) {
                lastVideoTime = vid.currentTime
                const res = handLandmarker.detectForVideo(vid, now)
                const hands = res.landmarks || []

                if (hands.length >= 2) {
                    const h1 = hands[0]
                    const h2 = hands[1]
                    const p1 = { x: (h1[4].x + h1[8].x + h1[9].x) / 3, y: (h1[4].y + h1[8].y + h1[9].y) / 3 }
                    const p2 = { x: (h2[4].x + h2[8].x + h2[9].x) / 3, y: (h2[4].y + h2[8].y + h2[9].y) / 3 }
                    const d = dist2D(p1, p2)

                    twoHandActiveFrames++
                    lastTwoHandTimestamp = now
                    holdFrames = 0

                    if (twoHandActiveFrames === 2) {
                        twoHandAnchorDist = Math.max(0.12, d)
                        twoHandAnchorZoom = stateRef.current.targetZoom
                    } else if (twoHandActiveFrames > 2 && twoHandAnchorDist) {
                        const ratioZoom = twoHandAnchorZoom * Math.pow(d / twoHandAnchorDist, 1.25)
                        const absZoom = 0.55 + ((d - 0.14) / 0.48) * 1.15
                        stateRef.current.targetZoom = Math.max(0.6, Math.min(1.8, ratioZoom * 0.65 + absZoom * 0.35))
                    }
                } else if (hands.length === 1) {
                    twoHandActiveFrames = 0
                    twoHandAnchorDist = null
                    if (now - lastTwoHandTimestamp > 400) {
                        const fCount = countFingers0To5(hands[0])
                        if (candidateStep === fCount) {
                            holdFrames = Math.min(5, holdFrames + 1)
                        } else {
                            candidateStep = fCount
                            holdFrames = 1
                        }
                        if (holdFrames >= 5) {
                            goToStep(fCount)
                        }
                    }
                } else {
                    twoHandActiveFrames = 0
                    twoHandAnchorDist = null
                    holdFrames = 0
                }
            }

            // Smoothly interpolate progress & zoom
            const st = stateRef.current
            const diff = st.targetProgress - st.currentProgress
            if (Math.abs(diff) > 0.001) {
                const step = Math.max(0.0038, Math.min(0.012, Math.abs(diff) * 0.06))
                st.currentProgress =
                    Math.abs(diff) <= step ? st.targetProgress : st.currentProgress + Math.sign(diff) * step
            } else {
                st.currentProgress = st.targetProgress
            }

            st.currentZoom += (st.targetZoom - st.currentZoom) * 0.16
            setZoomPct(Math.round(st.currentZoom * 100))

            // Render onto canvas
            const canvas = canvasRef.current
            const container = containerRef.current
            if (canvas && container) {
                const dpr = window.devicePixelRatio || 1
                const cw = container.clientWidth || 800
                const ch = container.clientHeight || 600
                if (canvas.width !== Math.round(cw * dpr) || canvas.height !== Math.round(ch * dpr)) {
                    canvas.width = Math.round(cw * dpr)
                    canvas.height = Math.round(ch * dpr)
                }
                const ctx = canvas.getContext("2d")
                if (ctx) {
                    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
                    ctx.clearRect(0, 0, cw, ch)

                    if (st.framesReady && st.frames.length > 0) {
                        const fFloat = st.currentProgress * (st.frames.length - 1)
                        const fFloor = Math.max(0, Math.min(st.frames.length - 1, Math.floor(fFloat)))
                        const fCeil = Math.max(0, Math.min(st.frames.length - 1, Math.ceil(fFloat)))
                        const frac = fFloat - fFloor
                        const frameA = st.frames[fFloor]
                        const frameB = fCeil !== fFloor ? st.frames[fCeil] : null
                        drawImmersive(ctx, cw, ch, frameA, frameB, frameA.width, frameA.height, frac, st.currentZoom)
                    } else {
                        // Fallback to step images if uploaded
                        const idx = Math.min(5, Math.round(st.currentProgress * 5))
                        const img = st.stepImgs[idx]
                        if (img && img.complete && img.naturalWidth > 0) {
                            drawImmersive(ctx, cw, ch, img, null, img.naturalWidth, img.naturalHeight, 0, st.currentZoom)
                        } else {
                            ctx.fillStyle = "#8c6239"
                            ctx.fillRect(0, 0, cw, ch)
                            ctx.fillStyle = "#fde047"
                            ctx.font = "600 16px system-ui, sans-serif"
                            ctx.textAlign = "center"
                            ctx.fillText(
                                videoFile
                                    ? "Decoding Origami Video Frames..."
                                    : "Upload 'origami_pikachu.mp4' in the Framer Properties panel →",
                                cw / 2,
                                ch / 2
                            )
                        }
                    }
                }
            }

            animId = requestAnimationFrame(tick)
        }

        loadMediaPipe()
        animId = requestAnimationFrame(tick)

        return () => {
            cancelAnimationFrame(animId)
            if (webcamRef.current && webcamRef.current.srcObject) {
                const stream = webcamRef.current.srcObject as MediaStream
                stream.getTracks().forEach((t) => t.stop())
            }
        }
    }, [videoFile])

    const currentStepInfo = STEPS[activeStep]

    return (
        <div
            ref={containerRef}
            onClick={async () => {
                if (!cameraReady && webcamRef.current) {
                    try {
                        const stream = await navigator.mediaDevices.getUserMedia({
                            video: { width: 640, height: 480, facingMode: "user" },
                        })
                        webcamRef.current.srcObject = stream
                        setCameraReady(true)
                        setCameraStatus("Camera Ready (0–5 Fingers)")
                    } catch {
                        setCameraStatus("Please allow camera permission")
                    }
                }
            }}
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                minHeight: 480,
                borderRadius,
                overflow: "hidden",
                background: "#8c6239",
                userSelect: "none",
                fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Inter, sans-serif",
            }}
        >
            <video
                ref={webcamRef}
                autoPlay
                playsInline
                muted
                style={{ position: "fixed", width: 1, height: 1, opacity: 0, pointerEvents: "none" }}
            />
            <video
                ref={sourceVideoRef}
                style={{ display: "none" }}
            />

            <canvas
                ref={canvasRef}
                style={{ position: "absolute", inset: 0, width: "100%", height: "100%", display: "block" }}
            />

            {/* Top-Left Step & Gesture Badges */}
            {hudVisible && (
                <div
                    style={{
                        position: "absolute",
                        top: 18,
                        left: 20,
                        display: "flex",
                        gap: 10,
                        zIndex: 10,
                        pointerEvents: "none",
                    }}
                >
                    <div
                        style={{
                            background: "rgba(32, 22, 14, 0.62)",
                            backdropFilter: "blur(14px)",
                            border: "1px solid rgba(250, 204, 21, 0.45)",
                            color: "#fde047",
                            padding: "7px 16px",
                            borderRadius: 999,
                            fontSize: 14,
                            fontWeight: 700,
                        }}
                    >
                        Step {currentStepInfo.stepNum} / 6 · {currentStepInfo.title}
                    </div>
                    <div
                        style={{
                            background: "rgba(32, 22, 14, 0.62)",
                            backdropFilter: "blur(14px)",
                            border: "1px solid rgba(255, 235, 200, 0.22)",
                            color: "#fff",
                            padding: "7px 15px",
                            borderRadius: 999,
                            fontSize: 14,
                            fontWeight: 600,
                        }}
                    >
                        {currentStepInfo.icon} {currentStepInfo.gestureText}
                    </div>
                </div>
            )}

            {/* Top-Right Controls */}
            <div
                style={{
                    position: "absolute",
                    top: 18,
                    right: 20,
                    display: "flex",
                    gap: 8,
                    zIndex: 20,
                }}
            >
                <div
                    style={{
                        background: "rgba(32, 22, 14, 0.62)",
                        backdropFilter: "blur(12px)",
                        border: "1px solid rgba(255, 235, 200, 0.22)",
                        color: "#fff",
                        padding: "6px 13px",
                        borderRadius: 999,
                        fontSize: 12,
                        fontWeight: 600,
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                    }}
                >
                    <span
                        style={{
                            width: 7,
                            height: 7,
                            borderRadius: "50%",
                            background: cameraReady ? "#22c55e" : "#f59e0b",
                        }}
                    />
                    {cameraStatus}
                </div>
                <button
                    onClick={() => {
                        stateRef.current.targetZoom = 1.0
                    }}
                    style={{
                        background: "rgba(32, 22, 14, 0.62)",
                        backdropFilter: "blur(12px)",
                        border: "1px solid rgba(255, 235, 200, 0.22)",
                        color: "#fff",
                        padding: "6px 13px",
                        borderRadius: 999,
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: "pointer",
                    }}
                >
                    🙌 Zoom: {zoomPct}%
                </button>
                <button
                    onClick={() => setHudVisible((v) => !v)}
                    style={{
                        background: "rgba(32, 22, 14, 0.62)",
                        backdropFilter: "blur(12px)",
                        border: "1px solid rgba(255, 235, 200, 0.22)",
                        color: "#fff",
                        padding: "6px 13px",
                        borderRadius: 999,
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: "pointer",
                    }}
                >
                    {hudVisible ? "Hide HUD" : "Show HUD"}
                </button>
            </div>

            {/* Bottom 6-Step Bar */}
            {hudVisible && (
                <div
                    style={{
                        position: "absolute",
                        bottom: 18,
                        left: "50%",
                        transform: "translateX(-50%)",
                        display: "flex",
                        gap: 8,
                        background: "rgba(32, 22, 14, 0.65)",
                        backdropFilter: "blur(16px)",
                        border: "1px solid rgba(255, 235, 200, 0.22)",
                        padding: "7px 10px",
                        borderRadius: 18,
                        zIndex: 20,
                        maxWidth: "95%",
                        overflowX: "auto",
                    }}
                >
                    {STEPS.map((s, idx) => {
                        const isActive = idx === activeStep
                        const thumbUrl =
                            [step1Image, step2Image, step3Image, step4Image, step5Image, step6Image][idx] ||
                            extractedThumbs[idx]
                        return (
                            <div
                                key={s.stepNum}
                                onClick={() => goToStep(idx)}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 8,
                                    padding: "5px 11px 5px 6px",
                                    borderRadius: 13,
                                    cursor: "pointer",
                                    background: isActive ? "rgba(250, 204, 21, 0.22)" : "rgba(255,255,255,0.06)",
                                    border: isActive
                                        ? "1px solid rgba(250, 204, 21, 0.75)"
                                        : "1px solid transparent",
                                    flexShrink: 0,
                                }}
                            >
                                {thumbUrl && (
                                    <img
                                        src={thumbUrl}
                                        alt=""
                                        style={{
                                            width: 36,
                                            height: 36,
                                            borderRadius: 8,
                                            objectFit: "cover",
                                        }}
                                    />
                                )}
                                <div>
                                    <div
                                        style={{
                                            fontSize: 12,
                                            fontWeight: 700,
                                            color: isActive ? "#fde047" : "#fff",
                                        }}
                                    >
                                        {s.icon} Step {s.stepNum}
                                    </div>
                                    <div style={{ fontSize: 10.5, color: "rgba(255,248,235,0.75)" }}>
                                        {s.gestureText}
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}

addPropertyControls(FramerOrigamiHandDetection, {
    videoFile: {
        type: ControlType.File,
        title: "Origami Video",
        allowedFileTypes: ["mp4", "webm", "mov"],
    },
    showBottomDock: {
        type: ControlType.Boolean,
        title: "Show HUD",
        defaultValue: true,
    },
    borderRadius: {
        type: ControlType.Number,
        title: "Radius",
        defaultValue: 20,
        min: 0,
        max: 48,
    },
    step1Image: { type: ControlType.Image, title: "Step 1 Img" },
    step2Image: { type: ControlType.Image, title: "Step 2 Img" },
    step3Image: { type: ControlType.Image, title: "Step 3 Img" },
    step4Image: { type: ControlType.Image, title: "Step 4 Img" },
    step5Image: { type: ControlType.Image, title: "Step 5 Img" },
    step6Image: { type: ControlType.Image, title: "Step 6 Img" },
})
