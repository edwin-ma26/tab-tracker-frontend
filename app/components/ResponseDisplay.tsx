interface ResponseDisplayProps {
    url: string;
    title: string;
    aiResponse: string;
  }
  
  export default function ResponseDisplay({
    url,
    title,
    aiResponse,
  }: ResponseDisplayProps) {
    return (
      <div className="mt-6 p-4 border rounded shadow-sm bg-gray-50">
        <h2 className="text-lg font-semibold">AI Response</h2>
        <p>
          <strong>URL:</strong> {url}
        </p>
        <p>
          <strong>Title:</strong> {title}
        </p>
        <p>
          <strong>AI Match:</strong> {aiResponse}
        </p>
      </div>
    );
  }
  