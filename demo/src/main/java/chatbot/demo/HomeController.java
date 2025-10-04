package chatbot.demo;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@CrossOrigin
@RestController
public class HomeController {
    @RequestMapping("/")
    public String home() {
        return "Spring Boot";
    }
    
}

AsyncHttpClient client = new DefaultAsyncHttpClient();
client.prepare("GET", "https://homeless-shelter.p.rapidapi.com/zipcode?zipcode=98004")
	.setHeader("x-rapidapi-key", "9b9e81e29cmshad754327cf7c3bcp1636c1jsn6e6f41957c77")
	.setHeader("x-rapidapi-host", "homeless-shelter.p.rapidapi.com")
	.execute()
	.toCompletableFuture()
	.thenAccept(System.out::println)
	.join();

client.close();
