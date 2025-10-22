package chatbot.demo;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;
import java.util.List;
import java.util.Map;

@RestController     // Makes this class a REST controller for HTTP requests
@CrossOrigin(origins = "https://utdshelterbot7.com")        // Allows requests from frontend
public class ChatController {

    // Handles POST requests to /chat endpoint
    @PostMapping("/chat")
    public Mono<ResponseEntity<String>> chat(@RequestBody Map<String, String> payload) {

        String userInput = payload.get("prompt");                       // Extract user's message from request body
        System.out.println("Received prompt: " + userInput);            // Makes sure spring boot received a message from frontend

        String systemPrompt = "You are a compassionate chatbot for the homeless. Respond only to what the user says. Do not complete their sentences unless asked.";      // Eventually replace with better text file
        String fullPrompt = systemPrompt + "\n\n" + userInput;                                  // need to fix: chatbot overcompensates and assumes something is wrong

        System.out.println("Sending POST to LM Studio.");
        WebClient client = WebClient.create("http://192.168.4.101:1234");   // Create WebClient that sends the request to LM Studio (temp)

        // Send POST request to LM Studio's chat completion endpoint
        return client.post()
            .uri("/v1/chat/completions")                    // LM Studio's endpoint
            .header("Content-Type", "application/json")     // Sets request content type
            .bodyValue(Map.of(                              // Build request body
                "model", "Mistral-7B-Instruct-v0.2-GGUF",   // Model name (NEEDS to be changed when choosing different model)
                "temperature", 0.7,                         // Randomness
                "max_tokens", 200,                          // Limit response length
                "messages", List.of(Map.of("role", "user", "content", fullPrompt))  // Chat format
            ))
            .retrieve()                     // Send request and ready to handle response
            .bodyToMono(String.class)       // Convert response body to Mono<String>
            .map(response -> {
                System.out.println("LM Studio response: " + response);      // Log/Confirm raw response from LMS
                return ResponseEntity.ok(response);                         // Return response (full JSON) to the frontend as a 200 ok
            })
            .onErrorResume(e -> {
                // Error handler and returns a 500 error message
                System.out.println("Error contacting LM Studio: " + e.getMessage());
                e.printStackTrace();
                return Mono.just(ResponseEntity.status(500).body("Chatbot error: " + e.getMessage()));
            });
    }
}
