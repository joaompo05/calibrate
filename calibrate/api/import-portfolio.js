export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { imageDataUrl } = req.body;

  if (!imageDataUrl) {
    return res.status(400).json({ error: "No image provided" });
  }

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4.1-mini",
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: `Extract portfolio holdings from this broker screenshot.

Return JSON only:

{
  "holdings": [
    {
      "ticker": "AMZN",
      "name": "Amazon",
      "shares": 3,
      "buyPrice": 170
    }
  ]
}`,
            },
            {
              type: "input_image",
              image_url: imageDataUrl,
            },
          ],
        },
      ],
    }),
  });

  const data = await response.json();

  const text =
    data.output_text ||
    data.output?.[0]?.content?.[0]?.text ||
    "";

  try {
    const parsed = JSON.parse(text);
    return res.status(200).json(parsed);
  } catch {
    return res.status(500).json({ error: "Parsing failed", raw: text });
  }
}