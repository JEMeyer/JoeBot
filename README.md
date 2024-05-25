# JoeBot: A Multi-Platform Bot for Discord and Slack

JoeBot is a versatile bot designed to operate on both Discord and Slack platforms. It interfaces with a backend to provide functionalities such as generating storyboards and images based on user prompts. This README will guide you through the setup, usage, and contribution process for JoeBot.

## Table of Contents

- [JoeBot: A Multi-Platform Bot for Discord and Slack](#joebot-a-multi-platform-bot-for-discord-and-slack)
  - [Table of Contents](#table-of-contents)
  - [Project Overview](#project-overview)
  - [Features](#features)
  - [Prerequisites](#prerequisites)
  - [Docker Run](#docker-run)
    - [Set Up Environment Variables](#set-up-environment-variables)
    - [Run the image](#run-the-image)
    - [Docker Compose](#docker-compose)
  - [Usage](#usage)
    - [Commands](#commands)
      - [Discord Commands](#discord-commands)
      - [Slack Commands](#slack-commands)
  - [Installation](#installation)
  - [Configuration](#configuration)
  - [Contributing](#contributing)
  - [License](#license)

## Project Overview

JoeBot is a multi-platform bot that can generate storyboards and images using AI. It leverages the power of Discord.js for Discord and Slack Bolt for Slack to interact with users and process their commands. The bot communicates with a backend service to perform tasks such as image generation and storyboard creation.

## Features

- **Multi-Platform Support**: Operates on both Discord and Slack.
- **AI-Powered**: Uses AI to generate images and storyboards based on user prompts.
- **Customizable Commands**: Users can interact with the bot using a variety of commands.
- **Error Handling**: Robust error handling to ensure smooth operation.

## Prerequisites

- Docker

## Docker Run

Running via docker will be the simplest to get up and running quickly.

### Set Up Environment Variables

Create a `.env` file in the root directory and add the following variables (look at the .env.tempalte to verify up to date .env variables):

```plaintext
DISCORD_BOT_TOKEN=your_discord_bot_token
SLACK_BOT_TOKEN=your_slack_bot_token
SLACK_APP_TOKEN=your_slack_app_token
BACKEND_URL=your_backend_url
API_TOKEN=your_api_token
SLACK_IMAGE_BACKUP_CHANNEL_ID=your_slack_image_backup_channel_id
NAS_PATH=your_nas_path
FAM_PHOTOS_FOLDER_PATH=your_family_photos_folder_path
WEAVIATE_HOST=ip_address_of_weaviate_for_slack_RAG
WEAVIATE_SCHEME=schema_for_RAG
```

### Run the image

To use the most recent image, pull the `latest` tag:

```bash
docker run --env-file ./.env  -p ghcr.io/jemeyer/joebot:latest
```

This will start the services for both the Slack and Discord bots.

### Docker Compose

You can also use JoeBot with Docker Compose. Here's an example docker-compose.yml file:

```yaml
services:
  joebot:
    image: ghcr.io/jemeyer/joebot:latest
    env_file: .env
```

Start the container with:

```bash
docker-compose up -d
```

## Usage

Once the bot is running, it will listen for commands on both Discord and Slack. Users can interact with the bot using the following commands:

### Commands

#### Discord Commands

- **!storyboard <prompt>**: Generates a storyboard based on the provided prompt.
- **!image <prompt> [flags]**: Generates an image based on the provided prompt. Optional flags include:
  - `--seed <integer>`: Specify a seed for the image generation.
  - `--scale <number>`: Set the guidance scale (1-30).
  - `--steps <integer>`: Set the number of diffusion steps (30-100).
  - `--raw`: Use the raw prompt without GPT processing.
  - `--useSecondary`: Use a secondary server for image generation.
  - `-help`: Display help information for the `!image` command.

#### Slack Commands

- **/storyboard <prompt>**: Generates a storyboard based on the provided prompt.
- **/imagegen <prompt>**: Generates an image based on the provided prompt using GPT processing.
- **/imagegenraw <prompt>**: Generates an image based on the provided prompt without GPT processing.
- **/imagegensecondary <prompt>**: Generates an image using a secondary server with GPT processing.
- **/imagegenrawsecondary <prompt>**: Generates an image using a secondary server without GPT processing.

## Installation

To get started with local JoeBot execution/modifications, follow these steps:

1. **Clone the Repository**:

   ```bash
   git clone https://github.com/yourusername/JoeBot.git
   cd JoeBot
   ```

2. **Install Dependencies**:

   ```bash
   npm install
   ```

3. **Set Up Environment Variables**:
   Create a `.env` file in the root directory as defined above.

4. **Run the Bot**:

   ```bash
   npm start
   ```

## Configuration

JoeBot requires several environment variables to be set for proper operation. These include tokens for Discord and Slack, as well as URLs and paths for backend services and file storage.

## Contributing

We welcome contributions to JoeBot! To contribute, follow these steps:

1. **Fork the Repository**: Click the "Fork" button at the top right of the repository page.
2. **Clone Your Fork**:

   ```bash
   git clone https://github.com/JEMeyer/JoeBot.git
   cd JoeBot
   ```

3. **Create a Branch**:

   ```bash
   git checkout -b your-feature-branch
   ```

4. **Make Your Changes**: Implement your feature or fix.
5. **Commit Your Changes**:

   ```bash
   git commit -m "Description of your changes"
   ```

6. **Push to Your Fork**:

   ```bash
   git push origin your-feature-branch
   ```

7. **Create a Pull Request**: Open a pull request on the original repository.

## License

This project is licensed under the GPL-3.0 License - see the [LICENSE](LICENSE) file for details.

---

Thank you for using JoeBot! If you have any questions or need further assistance, feel free to open an issue on GitHub.
