# src/ml/vision_model.py

import os
import numpy as np
from PIL import Image
try:
    import tensorflow as tf
    TF_AVAILABLE = True
except ImportError:
    TF_AVAILABLE = False
    print("⚠️ TensorFlow not available. Vision model will run in MOCK mode.")

class CrackDetectionModel:
    def __init__(self, model_path="geo_guard/colab_final_model.h5"):
        self.model_path = model_path
        self.model = None
        self.input_shape = (224, 224) # Standard for many transfer learning models
        self._load_model()

    def _load_model(self):
        """Load the Keras model from disk"""
        if not TF_AVAILABLE:
            print("Running in MOCK mode (TensorFlow missing)")
            return

        if not os.path.exists(self.model_path):
            print(f"⚠️ Warning: Model file not found at {self.model_path}")
            print("Running in MOCK mode (returning random predictions)")
            return

        try:
            self.model = tf.keras.models.load_model(self.model_path)
            print(f"✅ Vision Model loaded from {self.model_path}")
            
            # Try to infer input shape from model
            if hasattr(self.model, 'input_shape'):
                shape = self.model.input_shape
                # shape might be (None, 224, 224, 3)
                if shape and len(shape) == 4:
                    self.input_shape = (shape[1], shape[2])
                    print(f"ℹ️ Inferred input shape: {self.input_shape}")
                    
        except Exception as e:
            print(f"❌ Error loading model: {e}")
            print("Running in MOCK mode")

    def predict_crack(self, image_path):
        """
        Analyze an image for cracks.
        Returns: float (0.0 to 1.0 probability of crack/risk)
        """
        if self.model is None:
            # Mock behavior for testing without model file
            return self._mock_prediction()

        try:
            # 1. Load and Preprocess
            img = Image.open(image_path).convert('RGB')
            img = img.resize(self.input_shape)
            img_array = np.array(img) / 255.0  # Normalize to [0,1]
            img_array = np.expand_dims(img_array, axis=0)  # Add batch dimension

            # 2. Inference
            prediction = self.model.predict(img_array)
            
            # 3. Post-process
            # Assuming binary classification (Crack vs No Crack) or Risk Score
            # If output is single neuron sigmoid -> direct probability
            # If output is softmax [NoCrack, Crack] -> take second index
            
            score = 0.0
            if prediction.shape[-1] == 1:
                score = float(prediction[0][0])
            elif prediction.shape[-1] == 2:
                score = float(prediction[0][1]) # Assuming index 1 is 'Crack'
            else:
                # Fallback: take max or mean depending on architecture
                score = float(np.max(prediction))

            return score

        except Exception as e:
            print(f"❌ Prediction error: {e}")
            return 0.0

    def _mock_prediction(self):
        """Generate a fake score for testing"""
        import random
        return random.uniform(0.0, 1.0)

if __name__ == "__main__":
    # Test stub
    detector = CrackDetectionModel()
    # Create a dummy image for testing
    dummy_img_path = "test_rock.jpg"
    img = Image.new('RGB', (224, 224), color = 'gray')
    img.save(dummy_img_path)
    
    score = detector.predict_crack(dummy_img_path)
    print(f"Predicted Crack Risk: {score:.4f}")
    
    if os.path.exists(dummy_img_path):
        os.remove(dummy_img_path)
