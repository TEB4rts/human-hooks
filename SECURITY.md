# Security policy

## Reporting a vulnerability

Please report security issues privately to the project owner before public disclosure.

Include:

- affected version
- reproduction steps
- proof of concept if available
- impact assessment
- suggested mitigation if known

## Safe deployment guidance

Projects using `human-hooks` should:

- protect approval endpoints with authentication
- store signing secrets securely
- use HTTPS in production
- log approval actions and reviewer identities
- restrict high-risk queues to authorized reviewers
- avoid exposing raw sensitive payloads to public clients
