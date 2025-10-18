import os

# Optional heavy imports
CV2_IMPORT_ERROR = ""
try:
    import cv2  # type: ignore
    import numpy as np
    CV2_AVAILABLE = True
except ImportError as exc:
    cv2 = None  # type: ignore
    np = None  # type: ignore
    CV2_AVAILABLE = False
    CV2_IMPORT_ERROR = str(exc)

Interpreter = None
INTERPRETER_SOURCE = None
try:
    from tflite_runtime.interpreter import Interpreter  # type: ignore
    INTERPRETER_SOURCE = "tflite-runtime"
except ImportError:
    try:
        from tensorflow.lite.python.interpreter import Interpreter  # type: ignore
        INTERPRETER_SOURCE = "tensorflow"
    except ImportError:
        Interpreter = None

MODEL_PATH = os.getenv("FORGERY_MODEL_PATH", "forgery_model.tflite")
INTERPRETER = None
INPUT_DETAILS = None
OUTPUT_DETAILS = None
if Interpreter and os.path.exists(MODEL_PATH):
    try:
        INTERPRETER = Interpreter(model_path=MODEL_PATH)
        INTERPRETER.allocate_tensors()
        INPUT_DETAILS = INTERPRETER.get_input_details()
        OUTPUT_DETAILS = INTERPRETER.get_output_details()
    except Exception:
        INTERPRETER = None
        INPUT_DETAILS = None
        OUTPUT_DETAILS = None


def _preprocess_for_model(image):
    if not INTERPRETER or not INPUT_DETAILS:
        return None

    input_spec = INPUT_DETAILS[0]
    shape = input_spec.get("shape")
    if shape is None:
        return None

    height, width = int(shape[1]), int(shape[2])
    needs_grayscale = shape[-1] == 1

    resized = cv2.resize(image, (width, height))
    if needs_grayscale:
        resized = cv2.cvtColor(resized, cv2.COLOR_BGR2GRAY)
        resized = np.expand_dims(resized, axis=-1)

    tensor = resized.astype("float32") / 255.0
    tensor = np.expand_dims(tensor, axis=0)

    if input_spec.get("dtype") == np.uint8:
        tensor = (tensor * 255).astype("uint8")

    return tensor


def _heuristic_analysis(gray_image, metrics):
    variance = cv2.Laplacian(gray_image, cv2.CV_64F).var()
    metrics["sharpness"] = float(variance)

    edges = cv2.Canny(gray_image, 100, 200)
    metrics["edge_density"] = float(edges.mean() / 255.0)

    hist = cv2.calcHist([gray_image], [0], None, [256], [0, 256])
    hist_norm = hist / (hist.sum() + 1e-8)
    entropy = -np.sum(hist_norm * np.log2(hist_norm + 1e-8))
    metrics["entropy"] = float(entropy)

    score = 0.0
    if variance < 60:
        score += 0.4
    if metrics["edge_density"] < 0.05 or metrics["edge_density"] > 0.4:
        score += 0.3
    if entropy < 4.0:
        score += 0.3

    return min(max(score, 0.0), 1.0)


def analyze_document_advanced(image_bytes: bytes) -> dict:
    """
    VAFD-OCR: Verification-Aware Forgery Detection with trust scoring
    Advanced dual-branch analysis combining forgery detection + OCR confidence
    """
    if not CV2_AVAILABLE:
        return {
            "status": "unavailable",
            "error": f"OpenCV not installed: {CV2_IMPORT_ERROR}",
        }

    try:
        np_buffer = np.frombuffer(image_bytes, dtype=np.uint8)
        image = cv2.imdecode(np_buffer, cv2.IMREAD_COLOR)
        if image is None:
            return {"status": "error", "error": "Unable to decode image"}

        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        metrics = {}

        # Branch 1: Forgery Detection (visual consistency)
        forgery_score = _heuristic_analysis(gray, metrics)

        # Branch 2: OCR Confidence (if text extraction available)
        ocr_confidence = _estimate_ocr_confidence(gray, metrics)

        # Cross-modal verification
        trust_index = _calculate_trust_index(forgery_score, ocr_confidence, metrics)

        # Determine final verdict
        is_forged = trust_index < 0.5  # Low trust = likely forged

        return {
            "status": "ok",
            "is_forged": bool(is_forged),
            "forgery_confidence": round(forgery_score, 4),
            "ocr_confidence": round(ocr_confidence, 4),
            "trust_index": round(trust_index, 4),
            "model_used": "vafd_ocr_dual_branch",
            "metrics": metrics,
            "verification": {
                "visual_authenticity": "suspicious" if forgery_score > 0.6 else "acceptable",
                "text_quality": "poor" if ocr_confidence < 0.4 else "good",
                "overall_trust": "low" if trust_index < 0.5 else "high"
            }
        }
    except Exception as exc:
        return {"status": "error", "error": str(exc)}


def _estimate_ocr_confidence(gray_image, metrics):
    """Estimate OCR confidence based on image quality metrics"""
    # Text region detection using edge detection
    edges = cv2.Canny(gray_image, 50, 150)
    edge_density = edges.mean() / 255.0

    # Check for blur (variance of Laplacian)
    laplacian_var = cv2.Laplacian(gray_image, cv2.CV_64F).var()
    is_sharp = laplacian_var > 100

    # Contrast measurement
    contrast = gray_image.std()
    has_good_contrast = contrast > 40

    # Combine factors
    confidence = 0.5  # Base confidence

    if is_sharp:
        confidence += 0.2
    if has_good_contrast:
        confidence += 0.2
    if 0.1 < edge_density < 0.3:  # Optimal text edge density
        confidence += 0.1

    metrics['ocr_sharpness'] = float(laplacian_var)
    metrics['ocr_contrast'] = float(contrast)
    metrics['text_edge_density'] = float(edge_density)

    return min(max(confidence, 0.0), 1.0)


def _calculate_trust_index(forgery_score, ocr_confidence, metrics):
    """
    Calculate overall trust index combining both branches

    Trust = (1 - forgery_score) * 0.6 + ocr_confidence * 0.4
    """
    visual_trust = 1.0 - forgery_score
    trust_index = visual_trust * 0.6 + ocr_confidence * 0.4

    metrics['visual_trust'] = float(visual_trust)
    metrics['combined_trust'] = float(trust_index)

    return trust_index


def analyze_document(image_bytes: bytes) -> dict:
    if not CV2_AVAILABLE:
        return {
            "status": "unavailable",
            "error": f"OpenCV not installed: {CV2_IMPORT_ERROR}",
        }

    try:
        np_buffer = np.frombuffer(image_bytes, dtype=np.uint8)
        image = cv2.imdecode(np_buffer, cv2.IMREAD_COLOR)
        if image is None:
            return {"status": "error", "error": "Unable to decode image"}

        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        metrics = {}

        if INTERPRETER and INPUT_DETAILS and OUTPUT_DETAILS:
            tensor = _preprocess_for_model(image)
            if tensor is not None:
                INTERPRETER.set_tensor(INPUT_DETAILS[0]["index"], tensor)
                INTERPRETER.invoke()
                output = INTERPRETER.get_tensor(OUTPUT_DETAILS[0]["index"])
                confidence = float(output.flat[0])
                is_forged = confidence >= 0.5
                return {
                    "status": "ok",
                    "is_forged": bool(is_forged),
                    "confidence": round(confidence, 4),
                    "model_used": INTERPRETER_SOURCE,
                    "metrics": metrics,
                }

        score = _heuristic_analysis(gray, metrics)
        confidence = round(score, 4)
        is_forged = confidence >= 0.6
        return {
            "status": "ok",
            "is_forged": bool(is_forged),
            "confidence": confidence,
            "model_used": "heuristic",
            "metrics": metrics,
        }
    except Exception as exc:
        return {"status": "error", "error": str(exc)}
