from transformers import pipeline

print("Loading CrisisLens disaster AI...")

classifier = pipeline(
    "image-classification",
    model="Luwayy/disaster_images_model"
)

print("CrisisLens disaster AI loaded!")


def analyze_image(image_path):
    results = classifier(image_path)

    return results[:5]