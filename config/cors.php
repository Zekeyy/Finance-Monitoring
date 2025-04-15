<?php

return [
    'paths' => ['api/*'], // Ensure all API routes are covered
    'allowed_methods' => ['*'],
    'allowed_origins' => ['http://192.168.254.192:5173'], // Do not use '*' when withCredentials: true
    'allowed_origins_patterns' => [],
    'allowed_headers' => ['Authorization', 'Content-Type', 'Accept'],
    'exposed_headers' => ['Authorization'],
    'max_age' => 0,
    'supports_credentials' => true, // Ensure credentials are supported
];

