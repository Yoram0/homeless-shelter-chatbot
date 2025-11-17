package chatbot.demo;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

@Service
public class RapidService {

    private final WebClient client;

    public RapidService(@Value("${rapidapi.key}") String rapidApiKey) {
        this.client = WebClient.builder()
                .baseUrl("https://homeless-shelter.p.rapidapi.com")
                .defaultHeader("X-RapidAPI-Key", rapidApiKey)
                .defaultHeader("X-RapidAPI-Host", "homeless-shelter.p.rapidapi.com")
                .build();
    }

    public Mono<String> getByZip(String zipcode) {
        System.out.println("Calling RapidAPI /zipcode with zipcode=" + zipcode);
        return client.get()
                .uri(uriBuilder -> uriBuilder
                        .path("/zipcode")
                        .queryParam("zipcode", zipcode)
                        .build())
                .retrieve()
                .bodyToMono(String.class);
    }

    public Mono<String> getByCityState(String city, String state) {
        System.out.println("Calling RapidAPI /state-city with city=" + city + ", state=" + state);
        return client.get()
                .uri(uriBuilder -> uriBuilder
                        .path("/state-city")
                        .queryParam("state", state)
                        .queryParam("city", city)
                        .build())
                .retrieve()
                .bodyToMono(String.class);
    }
}
