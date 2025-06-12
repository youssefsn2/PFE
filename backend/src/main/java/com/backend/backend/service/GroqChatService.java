package com.backend.backend.service;

import okhttp3.*;
import org.json.JSONArray;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.util.List;
import java.util.Map;

@Service
public class GroqChatService {

    @Value("${groq.api.key}")
    private String apiKey;

    @Value("${groq.model}")
    private String model; // Exemple : llama3-8b-8192

    private static final String GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

    public String askWithHistory(List<Map<String, String>> messages) throws IOException {
        OkHttpClient client = new OkHttpClient();

        // Convertir la liste de messages en JSONArray
        JSONArray messageArray = new JSONArray();
        for (Map<String, String> m : messages) {
            JSONObject msg = new JSONObject()
                    .put("role", m.get("role"))
                    .put("content", m.get("content"));
            messageArray.put(msg);
        }

        // Construction du corps de la requête
        JSONObject requestBody = new JSONObject()
                .put("model", model)
                .put("messages", messageArray);

        Request request = new Request.Builder()
                .url(GROQ_URL)
                .addHeader("Authorization", "Bearer " + apiKey)
                .addHeader("Content-Type", "application/json")
                .post(RequestBody.create(
                        requestBody.toString(),
                        MediaType.parse("application/json")))
                .build();

        try (Response response = client.newCall(request).execute()) {
            if (!response.isSuccessful()) {
                throw new IOException("Groq API error (" + response.code() + "): " + response.body().string());
            }

            String responseBody = response.body().string();
            return new JSONObject(responseBody)
                    .getJSONArray("choices")
                    .getJSONObject(0)
                    .getJSONObject("message")
                    .getString("content");
        }
    }
}
