package chatbot.demo;

import org.springframework.stereotype.Controller;
import org.springframework.stereotype.Service;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

@CrossOrigin
@Controller
public class HomeController {

    private final RapidService rapidService;

    // inject the service (Spring will manage it automatically)
    public HomeController(RapidService rapidService) {
        this.rapidService = rapidService;
    }

    // serve react UI from static folder
    @RequestMapping(value = {"/{path:[^\\.]*}"})
    public String forward() {
        return "forward:/index.html";
    }

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
                .defaultHeader("x-rapidapi-key", "")
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
                .bodyToMono(String.class);
    }
}
