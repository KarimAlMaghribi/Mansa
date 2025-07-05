package com.example.backend;

import org.springframework.web.bind.annotation.*;

/** Alias controller to save user profiles via /profile endpoint. */
import com.example.backend.UserProfile;
import com.example.backend.UserProfileController;

@RestController
@RequestMapping("/profile")
@CrossOrigin(origins = "*")
public class ProfileController {
    private final UserProfileController delegate;

    public ProfileController(UserProfileController delegate) {
        this.delegate = delegate;
    }

    @GetMapping("/{uid}")
    public UserProfile getProfile(@PathVariable String uid) {
        return delegate.getByUid(uid);
    }

    @PutMapping("/{uid}")
    public UserProfile saveProfile(@PathVariable String uid, @RequestBody UserProfile profile) {
        return delegate.updateByUid(uid, profile);
    }
}
