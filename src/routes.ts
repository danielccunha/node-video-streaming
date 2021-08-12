import { resolve } from "path";
import { Router } from "express";
import { stat } from "fs/promises";
import { createReadStream } from "fs";

export const routes = Router();

// Route used to access the application
routes.get("/", (_request, response) => {
  const filepath = resolve(__dirname, "..", "public", "index.html");
  return response.sendFile(filepath);
});

// Route used to get the partial content of the video
// Based on: https://github.com/Abdisalan/blog-code-examples/blob/master/http-video-stream/index.js
routes.get("/video", async ({ headers }, response) => {
  // Streaming applications must send a range header to determine the segment of the video that should
  // be retrieve. In case this header is not information the application should return an error.
  if (!headers.range) {
    return response.status(400).json({ message: "Range header is required." });
  }

  // Load video information using filesystem library. In real applications this information would
  // be stored in the database, but since this is a study project I'm using a static file.
  const filepath = resolve(__dirname, "..", "data", "video.mp4");
  const { size } = await stat(filepath);

  // The range header contains information about the segment of the video that should be loaded (in bytes).
  // Parse received range and calculate the segment to be loaded/sent. The chunk size is the maximum length
  // of the content being sent to the client.
  const CHUNK_SIZE = 10 ** 6;

  // Parse the initial range of the video. On real applications we should handle possible errors doing this parsing
  const start = Number(headers.range.split("-")[0].replace(/\D/g, ""));

  // Calculate the end position of the segment, being the start with CHUNK_SIZE if less than the size size, otherwise
  // get the rest of the file, being the last segment to be loaded.
  const end = Math.min(start + CHUNK_SIZE, size - 1);

  // Define headers required for streaming/video devices. The status code 206 means PARTIAL CONTENT, used to identify
  // that the resource being request will be returned in multiple requests. The populate headers include required
  // information for streaming apps to handle the content loading and displaying/streaming.
  response.writeHead(206, {
    "Content-Range": `bytes ${start}-${end}/${size}`,
    "Accept-Ranges": "bytes",
    "Content-Length": end - start + 1,
    "Content-Type": "video/mp4",
  });

  // Load the video using streams for better performance and accuracy, then return it to the client. Streams are
  // basically a functionality of Node.js used to read/write a file in segments, without needing to load the entire
  // file to do a small change. For reference, I created a few examples in this repo: https://github.com/danielccunha/node-streams
  const stream = createReadStream(filepath, { start, end });
  return stream.pipe(response);
});
