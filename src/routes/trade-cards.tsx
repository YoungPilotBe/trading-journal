import { convexQuery } from "@convex-dev/react-query";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { api } from "../../convex/_external_types/tradingview_image_alert_types";

export const Route = createFileRoute("/trade-cards")({
  component: TradeCards,
});

function TradeCards() {
  // Get recent images with their URLs directly
  const {
    data: images,
    isLoading,
    error,
  } = useQuery(
    convexQuery(api.fileStorage.listFiles, {
      source: "tradingview",
      limit: 20,
    })
  );

  if (isLoading) {
    return (
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-4">Trading Images</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="bg-gray-200 animate-pulse rounded-lg h-48"
            ></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-4">Trading Images</h1>
        <div className="text-red-500">
          Error loading images: {error.message}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Trading Images</h1>

      {images && images.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {images.map((image) => (
            <div
              key={image._id}
              className="bg-white rounded-lg shadow-lg overflow-hidden"
            >
              <div className="aspect-video bg-gray-100">
                {image.downloadUrl ? (
                  <img src={image.downloadUrl} height="300px" width="auto" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    No image available
                  </div>
                )}
              </div>
              <div className="p-4">
                <h3 className="font-semibold truncate">{image.fileName}</h3>
                <p className="text-sm text-gray-500">Source: {image.source}</p>
                <p className="text-sm text-gray-400">
                  {new Date(image.uploadedAt).toLocaleString()}
                </p>
                <p className="text-xs text-gray-400">
                  Size: {(image.fileSize / 1024).toFixed(1)} KB
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-gray-500">No trading images found</p>
        </div>
      )}
    </div>
  );
}
