package chatbot.demo;


import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;
import org.springframework.http.MediaType;

import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@RestController
@CrossOrigin(origins = "https://utdshelterbot7.com")
public class ChatController {

    private final RapidService rapidService;

    public ChatController(RapidService rapidService) {
        this.rapidService = rapidService;
    }

    // LLM Model names
    String mistral = "mistral-7b-instruct-v0.2";        // Testing
    String llama = "llama-4-scout-17b-16e-instruct";    // Production

    @PostMapping(
    value = "/chat",
    produces = MediaType.APPLICATION_JSON_VALUE
)
public Mono<ResponseEntity<Map<String,String>>> chat(@RequestBody Map<String, String> payload) {
        String userInput = payload.get("prompt");
        System.out.println("______________________________________________________________________________________________________\n");
        System.out.println("Received prompt: " + userInput);

        // --- Only keep the latest user line ---
        int lastUserIndex = userInput.lastIndexOf("User:");
        if (lastUserIndex != -1) {
            userInput = userInput.substring(lastUserIndex + 5).trim();
            System.out.println("Trimmed to latest user input: " + userInput);
        }

        String systemPrompt = "You are a compassionate chatbot for the homeless. Respond only to what the user says. Be aware of potentially crisis-prone users. Do NOT let the conversation get off topic.";

        // --- Detect ZIP code ---
        Pattern zipPattern = Pattern.compile("\\b\\d{5}\\b");
        Matcher zipMatcher = zipPattern.matcher(userInput);

        if (zipMatcher.find() && userInput.toLowerCase().contains("shelter")) {
            String zipcode = zipMatcher.group();
            System.out.println("Detected shelter intent with ZIP: " + zipcode);
            return rapidService.getByZip(zipcode)
                .map(apiResponse -> {
                    System.out.println("Raw API response: " + apiResponse); // Debug log
                    String formatted = formatShelterResponse(apiResponse);
                    return ResponseEntity.ok(Map.of("reply", formatted));
                });
        }

        // --- Detect "shelter in City, State" ---
        if (userInput.toLowerCase().contains("shelter")) {
            Pattern cityStatePattern = Pattern.compile("shelter in ([A-Za-z\\s]+),?\\s*([A-Za-z]{2})", Pattern.CASE_INSENSITIVE);
            Matcher cityStateMatcher = cityStatePattern.matcher(userInput);

            if (cityStateMatcher.find()) {
                String city = cityStateMatcher.group(1).trim();
                String state = cityStateMatcher.group(2).trim();
                System.out.println("Detected shelter intent with City/State: " + city + ", " + state);

                return rapidService.getByCityState(city, state)
                    .map(apiResponse -> {
                        System.out.println("Raw API response: " + apiResponse); // Debug log
                        String formatted = formatShelterResponse(apiResponse);
                        return ResponseEntity.ok(Map.of("reply", formatted));
                    })
                    .onErrorResume(e -> {
                        System.out.println("Shelter API error: " + e.getMessage());
                        return Mono.just(ResponseEntity.status(404)
                            .body(Map.of("reply", "Sorry, I couldn’t find shelters for " + city + ", " + state)));
                    });
            }
        }

        // --- Send to LM Studio ---
        String fullPrompt = systemPrompt + "\n\n" + userInput;

        System.out.println("Sending POST to LM Studio.");
        WebClient client = WebClient.create("http://192.168.4.101:1234");

        return client.post()
            .uri("/v1/chat/completions")
            .header("Content-Type", "application/json")
            .bodyValue(Map.of(
                "model", mistral,
                "temperature", 0.7,
                "max_tokens", 200,
                "messages", List.of(Map.of("role", "user", "content", fullPrompt))
            ))
            .retrieve()
            .bodyToMono(String.class)
            .map(response -> {
                String reply = extractAssistantReply(response);
                System.out.println("LM Studio response: " + reply);
                // Explicitly set content type to application/json UTF-8
                return ResponseEntity
                    .ok()
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(Map.of("reply", reply));
            })
            .onErrorResume(e -> {
                System.out.println("Error contacting LM Studio: " + e.getMessage());
                e.printStackTrace();
                return Mono.just(
                    ResponseEntity.status(500)
                        .contentType(MediaType.APPLICATION_JSON)
                        .body(Map.of("reply", "Chatbot error: " + e.getMessage()))
                );
            });
    }

    private String extractAssistantReply(String json) {
        try {
            com.fasterxml.jackson.databind.JsonNode root =
                    new com.fasterxml.jackson.databind.ObjectMapper().readTree(json);
            return root.path("choices").get(0).path("message").path("content").asText();
        } catch (Exception e) {
            System.out.println("Error parsing LM Studio response: " + e.getMessage());
            return "[Error extracting reply]";
        }
    }

    private String formatShelterResponse(String json) {
        try {
            com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
            com.fasterxml.jackson.databind.JsonNode root = mapper.readTree(json);

            if (!root.isArray() || root.isEmpty()) {
                return "Sorry, no shelters were found for that location. Try another ZIP code or city/state.";
            }

            StringBuilder sb = new StringBuilder("Here are the nearest shelters:\n");
            for (com.fasterxml.jackson.databind.JsonNode shelter : root) {
                String name = shelter.has("shelter_name") ? shelter.path("shelter_name").asText()
                            : shelter.has("name") ? shelter.path("name").asText()
                            : "[Unnamed Shelter]";
                String address = shelter.path("address").asText();
                String city = shelter.path("city").asText();
                String state = shelter.path("state").asText();
                String zip = shelter.has("zip") ? shelter.path("zip").asText()
                            : shelter.has("zip_code") ? shelter.path("zip_code").asText()
                            : "";
                String phone = shelter.has("phone_number") ? shelter.path("phone_number").asText() : "";
                String website = shelter.has("official_website") ? shelter.path("official_website").asText() : "";

                sb.append("• ").append(name)
                  .append(" — ").append(address)
                  .append(", ").append(city)
                  .append(", ").append(state)
                  .append(" ").append(zip);

                if (!phone.isEmpty()) {
                    sb.append(" | Phone: ").append(phone);
                }
                if (!website.isEmpty()) {
                    sb.append(" | Website: ").append(website);
                }
                sb.append("\n");
            }
            return sb.toString();
        } catch (Exception e) {
            System.out.println("Error parsing shelter response: " + e.getMessage());
            return "Sorry, I couldn’t format the shelter information.";
        }
    }
}
