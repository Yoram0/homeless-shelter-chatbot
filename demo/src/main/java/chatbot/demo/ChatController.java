package chatbot.demo;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;
import org.springframework.http.MediaType;

import jakarta.annotation.PostConstruct;
import java.nio.file.Files;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@RestController
@CrossOrigin(origins = {
    "https://utdshelterbot7.com",
    "http://localhost:5173"
})
public class ChatController {

    private final RapidService rapidService;

    public ChatController(RapidService rapidService) {
        this.rapidService = rapidService;
    }

    // together.ai config from application.properties
    @Value("${llm.api.key}")
    private String apiKey;

    @Value("${llm.api.url}")
    private String apiUrl;

    @Value("${llm.model.dev}")
    private String devModel;

    @Value("${llm.model.prod}")
    private String prodModel;

    // system prompt file
    @Value("classpath:system-prompt.txt")
    private Resource systemPromptResource;

    private String systemPrompt;

    // Toggle: true (mistral [development]), false (llama [production])
    private boolean useDevModel = true;

    @PostConstruct
    public void init() throws Exception {
        systemPrompt = new String(Files.readAllBytes(systemPromptResource.getFile().toPath()));
        System.out.println("Loaded system prompt:\n" + systemPrompt);
    }

    @PostMapping(
        value = "/chat",
        produces = MediaType.APPLICATION_JSON_VALUE
    )
    public Mono<ResponseEntity<Map<String,String>>> chat(@RequestBody Map<String, Object> payload) {
        @SuppressWarnings("unchecked")
        List<Map<String, String>> messages = (List<Map<String, String>>) payload.get("messages");

        // enforce max turns (safety net)
        int MAX_TURNS = 8; // user+assistant messages
        List<Map<String, String>> systemMessages = new ArrayList<>();
        List<Map<String, String>> nonSystem = new ArrayList<>();
        for (Map<String, String> m : messages) {
            if ("system".equals(m.get("role"))) systemMessages.add(m);
            else nonSystem.add(m);
        }
        if (nonSystem.size() > MAX_TURNS) {
            nonSystem = nonSystem.subList(nonSystem.size() - MAX_TURNS, nonSystem.size());
        }
        messages = new ArrayList<>();
        messages.addAll(systemMessages);
        messages.addAll(nonSystem);

        // Extract latest user input for shelter detection
        String userInput = "";
        for (int i = messages.size() - 1; i >= 0; i--) {
            if ("user".equals(messages.get(i).get("role"))) {
                userInput = messages.get(i).get("content");
                break;
            }
        }

        System.out.println("Received latest user input: " + userInput);

        // Detect ZIP code
        String lower = userInput.toLowerCase();

        boolean wantsShelterHelp =
        lower.contains("shelter near")
     || lower.contains("find a shelter")
     || lower.contains("place to stay")
     || lower.contains("where can i stay")
     || lower.contains("need shelter")
     || lower.contains("help me find a shelter")
     || lower.contains("place to sleep")
     || lower.contains("find somewhere to stay")
     || lower.contains("can you help me find shelter")
     || lower.contains("homeless shelter");

        Pattern zipPattern = Pattern.compile("\\b\\d{5}\\b");
        Matcher zipMatcher = zipPattern.matcher(userInput);

        if (wantsShelterHelp) {
            if (zipMatcher.find()) {
        String zipcode = zipMatcher.group();
        System.out.println("Detected shelter intent with ZIP: " + zipcode);
        return rapidService.getByZip(zipcode)
            .map(apiResponse -> ResponseEntity.ok(Map.of("reply", formatShelterResponse(apiResponse))));
    }

    // ask politely for ZIP if not given
    return Mono.just(ResponseEntity.ok(
        Map.of("reply", "I’m here to help — what city or ZIP code are you in?")
    ));
}


        // Detect "shelter in City, State"
        if (userInput.toLowerCase().contains("shelter")) {
            Pattern cityStatePattern = Pattern.compile("shelter in ([A-Za-z\\s]+),?\\s*([A-Za-z]{2})", Pattern.CASE_INSENSITIVE);
            Matcher cityStateMatcher = cityStatePattern.matcher(userInput);

            if (cityStateMatcher.find()) {
                String city = cityStateMatcher.group(1).trim();
                String state = cityStateMatcher.group(2).trim();
                return rapidService.getByCityState(city, state)
                    .map(apiResponse -> {
                        String formatted = formatShelterResponse(apiResponse);
                        return ResponseEntity.ok(Map.of("reply", formatted));
                    })
                    .onErrorResume(e -> Mono.just(ResponseEntity.status(404)
                        .body(Map.of("reply", "Sorry, I couldn’t find shelters for " + city + ", " + state))));
            }
        }

        // Send to together.ai
        String modelName = useDevModel ? devModel : prodModel;
        WebClient client = WebClient.create(apiUrl);

        return client.post()
            .uri("/v1/chat/completions")
            .header("Authorization", "Bearer " + apiKey)
            .header("Content-Type", "application/json")
            .bodyValue(Map.of(
                "model", modelName,
                "temperature", 0.7,
                "max_tokens", 200,
                "messages", messages
            ))
            .retrieve()
            .bodyToMono(String.class)
            .map(response -> {
                String reply = extractAssistantReply(response);
                return ResponseEntity.ok(Map.of("reply", reply));
            })
            .onErrorResume(e -> Mono.just(
                ResponseEntity.status(500).body(Map.of("reply", "Chatbot error: " + e.getMessage()))
            ));
    }

    private String extractAssistantReply(String json) {
        try {
            com.fasterxml.jackson.databind.JsonNode root =
                    new com.fasterxml.jackson.databind.ObjectMapper().readTree(json);
            return root.path("choices").get(0).path("message").path("content").asText();
        } catch (Exception e) {
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

                if (!phone.isEmpty()) sb.append(" | Phone: ").append(phone);
                if (!website.isEmpty()) sb.append(" | Website: ").append(website);
                sb.append("\n");
            }
            return sb.toString();
        } catch (Exception e) {
            return "Sorry, I couldn’t format the shelter information.";
        }
    }
}
