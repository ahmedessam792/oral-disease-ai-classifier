# Claude Code Prompt — Oral Disease AI Classifier

You are the Senior AI Solutions Architect, Full-Stack Architect, MLOps Engineer, Product Designer, and Technical Lead for this project.

Work directly inside the current repository named:

`oral-disease-ai-classifier`

Start in **Plan Mode**.

Do not begin implementation until you complete the architecture plan and I explicitly approve it.

## Project Overview

This project is an **Oral Diseases Image Classification System**.

The application should allow a user to upload an oral or dental image, send it to a trained deep-learning image classification model, and display the predicted class, confidence score, and probability distribution through a professional web interface.

The academic requirements are:

- Build a Custom CNN model.
- Use 2–3 pretrained deep-learning models.
- Perform hyperparameter tuning.
- Evaluate and compare the models.
- Select the best-performing model.
- Deploy the selected model through a web application.

## Important Scope Boundary

I will personally complete all machine-learning work, including:

- Dataset preparation.
- Data preprocessing.
- Data augmentation.
- Custom CNN development.
- Pretrained-model experiments.
- Hyperparameter tuning.
- Training.
- Evaluation.
- Model comparison.
- Best-model selection.
- Exporting the final trained model.

Do not build, train, tune, evaluate, or compare any machine-learning model.

Do not invent:

- Disease classes.
- Accuracy values.
- Evaluation metrics.
- Confusion matrices.
- Model results.

After completing the modeling phase, I will manually place the final trained model and its supporting files inside:

`model/`

Your responsibility is to plan and later build:

- Project architecture.
- Frontend.
- Backend API.
- Model integration layer.
- Testing setup.
- Documentation.
- Docker setup.
- Deployment configuration.
- Skills and Claude Code resources.

The final model must be integrated later without redesigning the frontend or public API.

## Phase 0 — Discovery

Before proposing the architecture:

- Inspect all current files and folders.
- Check Git status.
- Detect the operating system.
- Check installed versions of Python, Node.js, npm, pnpm, Docker, and Git.
- Inspect existing Claude Code configuration.
- Inspect installed skills, agents, commands, plugins, hooks, and MCP servers.
- Identify whether the repository is empty or already contains useful work.
- Do not overwrite or delete useful files.
- Ask only essential blocking questions.
- Make reasonable assumptions for non-critical details and document them.

## Phase 1 — Stack and Architecture Plan

Compare realistic technology options and select the best stack for this project.

Evaluate these frontend options:

- Next.js App Router.
- React with Vite.
- TypeScript.
- Tailwind CSS.
- Framer Motion.

Evaluate these backend options:

- FastAPI.
- Flask.

Evaluate these deployment options:

- Vercel.
- Hugging Face Spaces.
- Render.
- Railway.
- Docker deployment.

My preferred starting direction is:

- Frontend: Next.js App Router.
- Language: TypeScript.
- Styling: Tailwind CSS.
- Animation: Framer Motion only when useful.
- Backend: FastAPI.
- Frontend deployment: Vercel.
- Backend and model deployment: Hugging Face Spaces using Docker or Render.
- Containerization: Docker.

Do not accept this stack automatically.

Validate the final decision based on:

- Python model integration.
- Maintainability.
- Development speed.
- Inference performance.
- Low-cost deployment.
- Portfolio quality.
- Medical-image privacy.
- Security.
- Testing.
- Accessibility.
- Responsive design.
- Ease of use for one student.
- Future extensibility without overengineering.

Avoid unnecessary:

- Microservices.
- Kubernetes.
- Message queues.
- Multiple databases.
- Authentication systems.
- Complex enterprise infrastructure.

Prefer a clean modular monorepo that one student can understand, run, test, deploy, and maintain.

## Database Decision

A database is probably unnecessary because the first version should:

- Receive an image.
- Validate it.
- Process it temporarily.
- Send it to the model.
- Return the classification result.
- Avoid permanently storing the image.

Do not create a database or ERD only to make the project look larger.

If no database is required, explain the decision and create:

- System architecture diagram.
- Component diagram.
- Upload and prediction sequence diagram.
- Model-loading flow.
- Deployment architecture diagram.

If you believe persistence is genuinely required, explain first:

- What data will be stored.
- Why it must be stored.
- The retention policy.
- Privacy risks.
- Why the application cannot work without persistence.

Wait for my approval before adding a database.

## Repository Structure

Evaluate and improve a structure similar to:

```text
oral-disease-ai-classifier/
├── apps/
│   ├── web/
│   └── api/
├── model/
├── skills/
├── docs/
├── tests/
├── scripts/
├── .github/
│   └── workflows/
├── .env.example
├── .gitignore
├── docker-compose.yml
└── README.md
```

The final structure should clearly separate:

- Frontend.
- Backend.
- Model integration.
- Configuration.
- Tests.
- Documentation.
- Skills and Claude Code resources.
- Deployment files.

## Model Integration Contract

Design a model-independent inference layer using abstractions such as:

- `ModelAdapter`
- `ModelService`
- `InferenceService`
- `PredictionService`

The frontend and public API must not depend directly on TensorFlow, PyTorch, or ONNX implementation details.

Support configurable model metadata:

- Model name.
- Model version.
- Framework.
- Model path.
- Input width.
- Input height.
- Number of channels.
- Color mode.
- Class labels.
- Preprocessing method.
- Normalization method.
- Confidence threshold.
- Maximum upload size.

Possible model formats may include:

- `.keras`
- `.h5`
- TensorFlow SavedModel
- `.pt`
- `.pth`
- ONNX

Do not install every machine-learning framework.

The final dependency must be selected only after I provide the final model.

The prediction API response should contain:

- `predicted_class`
- `confidence`
- `probabilities`
- `model_name`
- `model_version`

Do not invent class labels.

Prepare:

- `model/README.md`
- `model/metadata.example.json`
- `model/labels.example.json`
- `model/.gitkeep`

The model README must explain:

- Where to place the final model.
- How to configure its path.
- How to define its framework.
- How to define class labels.
- How to configure input size.
- How to configure preprocessing.
- How to configure normalization.
- How to test the adapter.
- How to replace development mock mode with the real model.

A mock predictor may exist only for:

- Frontend development.
- Automated testing.
- Demonstrating interface states before the real model exists.

Mock mode must be clearly labeled as development-only.

It must never be presented as a real medical result.

Production mode must fail clearly and safely when no real model is configured.

## Backend Architecture

Prefer FastAPI unless another option is clearly better.

Design routes similar to:

- `GET /health`
- `GET /api/v1/model/info`
- `POST /api/v1/predict`

Use:

- Pydantic schemas.
- Modular routers.
- Centralized configuration.
- Environment-variable validation.
- API versioning.
- Consistent typed errors.
- Sanitized structured logging.
- Health checks.
- OpenAPI documentation.
- Clear separation between routes, services, adapters, preprocessing, schemas, and configuration.

The prediction endpoint must validate:

- File extension.
- MIME type.
- File size.
- Empty uploads.
- Corrupted images.
- Unsupported formats.
- Unsafe image dimensions.
- Decompression-bomb risks.
- Image orientation when appropriate.

Process images in memory when practical.

Do not permanently store uploaded images.

Do not log:

- Image bytes.
- Sensitive image metadata.
- Internal model paths.
- Secrets.

Configure CORS through environment variables.

Never use wildcard CORS in production.

## Frontend Product Experience

The application must feel like a premium AI healthcare product, not a basic student upload page or generic SaaS dashboard.

Include:

- Professional hero or introduction section.
- Clear project explanation.
- Drag-and-drop upload.
- Click-to-upload.
- Image preview.
- File validation.
- Remove and replace controls.
- Analyze button.
- Duplicate-submission protection.
- Professional loading state.
- Classification result.
- Predicted class.
- Confidence score.
- Probability distribution.
- Model name and version.
- Analyze-another-image action.
- Invalid-file state.
- Missing-model state.
- Backend-unavailable state.
- General error state.
- Model information section.
- How-it-works section.
- Limitations section.
- Privacy notice.
- Educational medical disclaimer.
- Responsive desktop, tablet, and mobile layouts.
- Keyboard accessibility.
- Visible focus states.
- Reduced-motion support.

Use responsible wording such as:

- “AI Classification Result.”
- “Educational and research use only.”
- “This system is not a substitute for professional medical advice, diagnosis, or treatment.”

Never describe the result as a confirmed diagnosis.

## Frontend Engineering

Use:

- TypeScript strict mode.
- Reusable components.
- A centralized typed API client.
- Environment-based backend URL.
- Type-safe API responses.
- Semantic HTML.
- Accessible forms.
- Clear upload, loading, success, empty, and error states.
- Browser object URL cleanup.
- Route-level and component-level error handling.
- Responsive layouts.
- Reduced-motion support.
- Reproducible lock files.

Do not:

- Hardcode production URLs.
- Show fake medical predictions in production.
- Use excessive gradients.
- Use excessive glassmorphism.
- Add unnecessary animation.
- Use oversized cards everywhere.
- Create a generic dashboard layout.
- Copy another healthcare website.

The visual identity should feel:

- Premium.
- Calm.
- Trustworthy.
- Modern.
- Clean.
- Clinically responsible.
- Original.
- Portfolio-worthy.

## Design System

Before implementing the UI, define:

- Product personality.
- Brand attributes.
- Typography.
- Color strategy.
- Spacing scale.
- Border-radius system.
- Elevation system.
- Iconography.
- Motion principles.
- Accessibility rules.
- Desktop layout.
- Tablet layout.
- Mobile layout.
- Upload state.
- Loading state.
- Result state.
- Error state.
- Missing-model state.

Document this in:

`docs/DESIGN_SYSTEM.md`

## Skills and Claude Code Resources

Create a focused:

`skills/`

folder.

Potential resources include:

- `ui-ux-pro-max`
- `Impeccable-UI`
- `taste-skill`
- `theme-factory`
- `Brand Guideline`
- Emil Kowalski-inspired interaction guidance.
- `gstack`: https://github.com/garrytan/gstack
- `superpowers`
- `karpathy-skills`
- `everything-claude-code`
- `awesome-claude-code`
- Playwright MCP.

Before installing or copying anything:

- Inspect what is already installed.
- Verify the official or original repository.
- Review its README.
- Review its license.
- Confirm its purpose and relevance.
- Do not guess repository URLs.
- Do not blindly execute remote installation scripts.
- Do not install everything listed.
- Do not clone large unrelated repositories into the project.

Correctly distinguish between:

- Skills.
- Slash commands.
- Agents.
- Plugins.
- Hooks.
- MCP servers.
- Reference repositories.

Playwright MCP must be configured as an MCP integration when appropriate, not copied into skills as a normal file.

Keep selected resources small, useful, and non-duplicative.

Create:

- `skills/README.md`
- `skills/SOURCES.md`

Record:

- Resource name.
- Official source.
- License.
- Purpose.
- Installation status.
- How it is used in this project.

Verify actual slash-command names before invoking any skill.

Prioritize focused project skills covering:

- Healthcare interface design.
- Upload and prediction UX.
- Accessibility.
- Responsive design.
- Motion and interaction review.
- Security review.
- API integration review.
- Playwright testing.

## Testing Strategy

Plan backend tests for:

- Health endpoint.
- Model-information endpoint.
- Valid image upload.
- Invalid extension.
- Invalid MIME type.
- Oversized file.
- Empty file.
- Corrupted image.
- Unsafe image dimensions.
- Missing model.
- Mock-mode isolation.
- Prediction contract.
- Image preprocessing.

Plan frontend tests for:

- Upload interaction.
- Validation.
- Image preview.
- Remove and replace behavior.
- Loading state.
- Result state.
- API errors.
- Missing-model state.
- Backend-unavailable state.
- Accessibility.

Plan Playwright tests for:

- Successful development mock workflow.
- Invalid upload.
- Backend unavailable.
- Analyze another image.
- Desktop viewport.
- Tablet viewport.
- Mobile viewport.
- Keyboard navigation.
- Basic accessibility checks.

During implementation, actually run:

- Backend tests.
- Frontend tests.
- Linting.
- Type checking.
- Playwright tests.
- Production builds.
- Docker validation.

Never claim a test passed unless it was actually executed successfully.

## Deployment Strategy

Evaluate:

- Next.js frontend on Vercel.
- FastAPI and model on Hugging Face Spaces using Docker.
- Render.
- Railway.
- Single Docker deployment.

Consider:

- Model file size.
- RAM requirements.
- CPU or GPU requirements.
- Cold starts.
- Request time limits.
- Docker support.
- Free-tier limitations.
- Health checks.
- CORS.
- Environment variables.
- Model loading during startup.
- Safe behavior if model loading fails.

Do not place a large Python deep-learning model inside a Vercel serverless function.

Prepare deployment files and documentation only.

Do not:

- Deploy the application.
- Push to GitHub.
- Create external services.
- Purchase resources.
- Create paid infrastructure.

These actions require my explicit approval.

## Security and Privacy

Because users may upload medical images:

- Do not store images permanently by default.
- Process images in memory when practical.
- Delete temporary files immediately when unavoidable.
- Do not log image content.
- Do not log sensitive metadata.
- Do not expose internal paths.
- Validate all uploads.
- Use safe public error messages.
- Store secrets in environment variables.
- Exclude models, datasets, uploads, secrets, caches, and generated artifacts from Git.
- Use secure production CORS.
- Avoid analytics and trackers by default.
- Document privacy limitations clearly.

## Documentation

Plan to create:

- `README.md`
- `docs/PROJECT_PLAN.md`
- `docs/ARCHITECTURE.md`
- `docs/MODEL_INTEGRATION.md`
- `docs/API_CONTRACT.md`
- `docs/DESIGN_SYSTEM.md`
- `docs/SECURITY_AND_PRIVACY.md`
- `docs/TESTING.md`
- `docs/DEPLOYMENT.md`
- `docs/DECISIONS/`
- `model/README.md`
- `skills/README.md`
- `skills/SOURCES.md`

Use Mermaid diagrams for:

- System architecture.
- Component flow.
- Upload and prediction sequence.
- Model-loading flow.
- Local development flow.
- Deployment architecture.

## Hard Restrictions

Do not:

- Build the Custom CNN.
- Train pretrained models.
- Perform hyperparameter tuning.
- Compare model performance.
- Invent disease classes.
- Invent model results.
- Present fake results as real.
- Add an unnecessary database.
- Permanently store uploaded images.
- Expose secrets.
- Install every referenced repository.
- Run unverified scripts.
- Delete existing work without inspection.
- Push to GitHub.
- Deploy without approval.
- Create paid resources.
- Begin implementation before plan approval.
- Claim completion without verification.

## Plan Deliverable

Produce one complete architecture plan containing:

1. Project understanding.
2. Assumptions.
3. Scope boundaries.
4. Functional requirements.
5. Non-functional requirements.
6. Stack comparison.
7. Recommended stack.
8. Architecture rationale.
9. Repository structure.
10. Database decision.
11. System architecture diagram.
12. Request and inference flow.
13. Model integration contract.
14. API contract.
15. Frontend page and component map.
16. Design direction.
17. Security and privacy strategy.
18. Testing strategy.
19. Deployment strategy.
20. Skills strategy.
21. Implementation phases.
22. Acceptance criteria.
23. Risks and mitigations.
24. Essential blocking questions.

Do not start implementation.

After presenting the plan, stop and wait for my approval.
