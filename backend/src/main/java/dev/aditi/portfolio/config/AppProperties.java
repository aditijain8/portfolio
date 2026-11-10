package dev.aditi.portfolio.config;

import java.util.List;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.bind.DefaultValue;

@ConfigurationProperties(prefix = "app")
public record AppProperties(
        @DefaultValue("http://localhost:5173") String publicUrl,
        @DefaultValue Cors cors,
        @DefaultValue Storage storage,
        @DefaultValue Admin admin,
        @DefaultValue Login login,
        @DefaultValue Contact contact) {

    public record Cors(@DefaultValue List<String> allowedOrigins) {}

    public record Storage(@DefaultValue("database") String type, @DefaultValue("./data/files") String localDir) {}

    public record Admin(String email, String password, @DefaultValue("false") boolean reset) {}

    public record Login(@DefaultValue("5") int maxFailures, @DefaultValue("15") int windowMinutes) {}

    public record Contact(
            @DefaultValue("true") boolean enabled, String notifyEmail, String fromEmail) {}
}
