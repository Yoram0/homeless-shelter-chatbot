package chatbot.demo;

import org.springframework.stereotype.Controller;
import org.springframework.stereotype.Service;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;
import org.springframework.http.ResponseEntity;
import java.util.Map;
import org.json.JSONArray;
import org.json.JSONObject;


@CrossOrigin
@Controller
public class HomeController {

    private final RapidService rapidService;

    // inject the service (Spring will manage it automatically)
    public HomeController(RapidService rapidService) {
        this.rapidService = rapidService;
    }

    // serve react UI from static folder
    @RequestMapping("/")
    public String index() {
        return "forward:/index.html";
    }

    /* needed "/" to serve from static
    // test endpoint to verify Spring is running
    @GetMapping("/")
    public String home() {
        return "Spring Boot is running";
    }
    */

    // GET method to call the RapidAPI needs zipcode
    @ResponseBody
    @GetMapping("/api/shelter")
    public Mono<String> getShelterByZip(@RequestParam String zipcode) {
        return rapidService.getByZip(zipcode);
    }
}

@Service
class RapidService {

    private final WebClient client;

    public RapidService() {
        this.client = WebClient.builder()
                .baseUrl("https://homeless-shelter.p.rapidapi.com")
                .defaultHeader("x-rapidapi-key", "9b9e81e29cmshad754327cf7c3bcp1636c1jsn6e6f41957c77")
                .defaultHeader("x-rapidapi-host", "homeless-shelter.p.rapidapi.com")
                .build();
    }

public Mono<String> getByZip(String zipcode) {
    return client.get()
        .uri(uriBuilder -> uriBuilder
            .path("/zipcode")
            .queryParam("zipcode", zipcode)
            .build())
        .retrieve()
        .bodyToMono(String.class)
        .onErrorResume(e ->
            Mono.just("{\"error\":\"Could not retrieve shelters. Please call 2-1-1 for urgent help.\"}")
        );
}


private String formatShelterReply(String shelterJson, String zipcode) {
    // Parse JSON (can use org.json or Jackson); below is a simple approach
    // For illustration assuming shelterJson is a JSON array
    try {
        JSONArray shelters = new JSONArray(shelterJson);
        if (shelters.length() == 0) {
            return "There are no shelters found directly in ZIP code " + zipcode + ". Try a nearby ZIP or call 2-1-1.";
        }
        StringBuilder sb = new StringBuilder();
        sb.append("Here are some shelters near ZIP code ").append(zipcode).append(":\n");
        for (int i = 0; i < Math.min(shelters.length(), 3); i++) {
            JSONObject shelter = shelters.getJSONObject(i);
            sb.append("\n").append(shelter.getString("name"))
              .append("\n").append(shelter.getString("address"))
              .append("\nPhone: ").append(shelter.optString("phone_number", "N/A"))
              .append("\n");
        }
        return sb.toString();
    } catch (Exception e) {
        return "I had trouble parsing shelter data. Please try again, or call 2-1-1 for urgent shelter info.";
    }
}




@PostMapping("/chat")
public Mono<ResponseEntity<String>> chat(@RequestBody Map<String, String> payload) {
    String userInput = payload.get("prompt");
    System.out.println("Received prompt: " + userInput);

    // If input is a ZIP code (adjust regex as needed)
    if (userInput != null && userInput.matches("\\d{5}")) {
        return this.getByZip(userInput)
            .map(shelterJson -> {
                // Format response for chatbot
                String reply = formatShelterReply(shelterJson, userInput);
                return ResponseEntity.ok(reply);
            })
            .onErrorResume(e -> {
                return Mono.just(
                    ResponseEntity.ok("Sorry, I couldn't find shelters for ZIP code " + userInput + ". You can call 2-1-1 for help.")
                );
            });
    }
    
    // Default response for non-ZIP code input
    return Mono.just(ResponseEntity.ok("Please provide a valid 5-digit ZIP code to find shelters in your area."));
}
    
}





