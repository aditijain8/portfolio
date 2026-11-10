package dev.aditi.portfolio.security;

import org.springframework.security.core.authority.AuthorityUtils;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
public class AdminUserDetailsService implements UserDetailsService {

    public static final String ROLE_ADMIN = "ROLE_ADMIN";

    private final AdminUserRepository repository;

    public AdminUserDetailsService(AdminUserRepository repository) {
        this.repository = repository;
    }

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        AdminUser admin = repository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new UsernameNotFoundException("Unknown administrator"));
        return new User(admin.getEmail(), admin.getPasswordHash(), AuthorityUtils.createAuthorityList(ROLE_ADMIN));
    }
}
