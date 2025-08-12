# Test Case Generator - Backend API

FastAPI backend for the Test Case Generator application that integrates with GitHub and OpenRouter AI.

## Features

- 🔐 GitHub OAuth authentication
- 📁 Repository and file browsing
- 🤖 AI-powered test case generation via OpenRouter
- 📝 Full test code generation
- 🔄 Pull request creation
- 🛡️ Secure token handling

## Setup

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Environment Configuration

Copy the example environment file:
```bash
cp .env.example .env
```

Fill in your credentials in `.env`:

```env
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
OPENROUTER_API_KEY=your_openrouter_api_key
SECRET_KEY=your_secret_key_for_sessions
FRONTEND_URL=http://localhost:5173
```

#### Getting GitHub OAuth Credentials

1. Go to GitHub Settings → Developer settings → OAuth Apps
2. Click "New OAuth App"
3. Fill in:
   - Application name: "Test Case Generator"
   - Homepage URL: `http://localhost:5173`
   - Authorization callback URL: `http://localhost:5173/auth/callback`
4. Copy the Client ID and Client Secret

#### Getting OpenRouter API Key

1. Visit [OpenRouter.ai](https://openrouter.ai/)
2. Sign up/login and go to API Keys
3. Create a new API key
4. Copy the key to your `.env` file

### 3. Run the Server

```bash
python run.py
```

The API will be available at:
- **API**: http://localhost:8000
- **Documentation**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/health

## API Endpoints

### Authentication
- `GET /auth/github` - Get GitHub OAuth URL
- `POST /auth/callback` - Handle OAuth callback
- `GET /auth/user` - Get current user info
- `POST /auth/logout` - Logout user

### Repositories
- `GET /repositories` - List user repositories
- `GET /repositories/{owner}/{repo}/files` - Get repository files
- `GET /repositories/{owner}/{repo}/file-content` - Get file content

### AI Generation
- `POST /generate-test-suggestions` - Generate test case suggestions
- `POST /generate-test-code` - Generate full test code

### Pull Requests
- `POST /create-pull-request` - Create PR with test code

## Supported Languages & Frameworks

| Language   | Framework | File Extensions |
|------------|-----------|-----------------|
| Python     | pytest    | .py             |
| JavaScript | jest      | .js, .jsx       |
| TypeScript | jest      | .ts, .tsx       |
| Java       | junit     | .java           |
| Go         | testing   | .go             |
| Ruby       | rspec     | .rb             |

## Security Features

- GitHub tokens stored server-side only
- Session-based authentication
- Input validation and sanitization
- CORS protection
- Rate limiting ready (can be added)

## Development

### Project Structure
```
backend/
├── main.py           # Main FastAPI application
├── run.py           # Development server runner
├── requirements.txt # Python dependencies
├── .env.example    # Environment template
└── README.md       # This file
```

### Adding New Features

1. **New AI Models**: Update the `call_openrouter_api` function
2. **New Languages**: Extend `detect_test_framework` and `is_code_file`
3. **New Endpoints**: Add to `main.py` following FastAPI patterns

### Error Handling

The API includes comprehensive error handling:
- GitHub API errors (401, 403, 404, etc.)
- OpenRouter API errors
- Session validation
- Input validation via Pydantic models

## Deployment

### Quick Setup
```bash
chmod +x deploy.sh
./deploy.sh
```

### Manual Setup
```bash
# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your credentials

# Test the setup
python test_api.py

# Start development server
python run.py
```

### Production Deployment

#### Render (Recommended)
1. Connect your GitHub repo to Render
2. Create a new Web Service
3. Set build command: `pip install -r requirements.txt`
4. Set start command: `python start_production.py`
5. Add environment variables in Render dashboard

#### Railway
1. Connect GitHub repo to Railway
2. Railway auto-detects Python and installs dependencies
3. Set start command: `python start_production.py`
4. Add environment variables in Railway dashboard

#### Heroku
1. Create `Procfile`: `web: python start_production.py`
2. Deploy via Git or GitHub integration
3. Set environment variables via Heroku CLI or dashboard

#### Manual Server Deployment
```bash
# On your server
git clone <your-repo>
cd backend
pip install -r requirements.txt

# Set environment variables
export GITHUB_CLIENT_ID=your_id
export GITHUB_CLIENT_SECRET=your_secret
export OPENROUTER_API_KEY=your_key
export FRONTEND_URL=https://your-frontend.com
export PORT=8000

# Start with production settings
python start_production.py
```

### Production Checklist
- ✅ Set `FRONTEND_URL` to your production frontend URL
- ✅ Use a secure `SECRET_KEY` (generate with `python -c "import secrets; print(secrets.token_hex(32))"`)
- ✅ Enable HTTPS in production
- ✅ Set up proper logging
- ✅ Consider rate limiting for production use

## Troubleshooting

### Common Issues

1. **GitHub OAuth not working**
   - Check callback URL matches exactly
   - Verify client ID/secret are correct

2. **OpenRouter API errors**
   - Verify API key is valid
   - Check rate limits and credits

3. **CORS errors**
   - Ensure `FRONTEND_URL` matches your frontend exactly
   - Check browser console for specific CORS errors

### Debug Mode

Run with debug logging:
```bash
PYTHONPATH=. uvicorn main:app --reload --log-level debug
```

## Contributing

1. Follow FastAPI best practices
2. Add type hints for all functions
3. Include error handling for external API calls
4. Update this README for new features