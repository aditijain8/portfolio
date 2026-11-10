package dev.aditi.portfolio.storage;

import dev.aditi.portfolio.config.AppProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.transaction.PlatformTransactionManager;

@Configuration
public class StorageConfig {

    @Bean
    FileStorage fileStorage(AppProperties props, StoredFileRepository repository) {
        String type = props.storage().type();
        return switch (type) {
            case "local" -> new LocalFileStorage(props.storage().localDir());
            case "database" -> new DatabaseFileStorage(repository);
            default -> throw new IllegalStateException("app.storage.type must be 'local' or 'database'");
        };
    }

    @Bean
    TransactionTemplate transactionTemplate(PlatformTransactionManager manager) {
        return new TransactionTemplate(manager);
    }
}
