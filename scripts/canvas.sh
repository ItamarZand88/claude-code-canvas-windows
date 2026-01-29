#!/bin/bash
# Claude Canvas - Helper Script
# Quick commands for testing and development

set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

show_help() {
    echo -e "\033[36mClaude Canvas - Helper Script\033[0m"
    echo ""
    echo -e "\033[33mUsage:\033[0m"
    echo "  ./scripts/canvas.sh <command> [canvas] [args]"
    echo ""
    echo -e "\033[33mCommands:\033[0m"
    echo "  env          - Show environment detection"
    echo "  test         - Run test suite"
    echo "  show         - Show canvas in current terminal"
    echo "  spawn        - Spawn canvas in split pane"
    echo "  example      - Run example configuration"
    echo "  install      - Install dependencies"
    echo ""
    echo -e "\033[33mCanvas Types:\033[0m"
    echo "  calendar, document, flight"
    echo ""
    echo -e "\033[32mExamples:\033[0m"
    echo "  ./scripts/canvas.sh env"
    echo "  ./scripts/canvas.sh test"
    echo "  ./scripts/canvas.sh show calendar"
    echo "  ./scripts/canvas.sh spawn calendar"
    echo "  ./scripts/canvas.sh example calendar"
    echo "  ./scripts/canvas.sh example document"
}

check_bun() {
    if ! command -v bun &> /dev/null; then
        echo -e "\033[31mError: Bun is not installed\033[0m"
        echo ""
        echo -e "\033[33mInstall Bun:\033[0m"
        echo '  curl -fsSL https://bun.sh/install | bash'
        exit 1
    fi
}

cmd_env() {
    echo -e "\033[36mDetecting terminal environment...\033[0m"
    bun run canvas/src/cli.ts env
}

cmd_test() {
    echo -e "\033[36mRunning test suite...\033[0m"
    cd "$PROJECT_ROOT"
    bun test
}

cmd_install() {
    echo -e "\033[36mInstalling dependencies...\033[0m"
    cd "$PROJECT_ROOT"
    bun install
    echo -e "\033[32mDependencies installed successfully!\033[0m"
}

cmd_show() {
    local canvas_type="$1"
    
    if [ -z "$canvas_type" ]; then
        echo -e "\033[31mError: Canvas type required\033[0m"
        echo "Usage: ./scripts/canvas.sh show <calendar|document|flight>"
        exit 1
    fi
    
    echo -e "\033[36mShowing $canvas_type in current terminal...\033[0m"
    bun run canvas/src/cli.ts show "$canvas_type"
}

cmd_spawn() {
    local canvas_type="$1"
    
    if [ -z "$canvas_type" ]; then
        echo -e "\033[31mError: Canvas type required\033[0m"
        echo "Usage: ./scripts/canvas.sh spawn <calendar|document|flight>"
        exit 1
    fi
    
    echo -e "\033[36mSpawning $canvas_type in split pane...\033[0m"
    bun run canvas/src/cli.ts spawn "$canvas_type"
}

cmd_example() {
    local canvas_type="$1"
    
    if [ -z "$canvas_type" ]; then
        echo -e "\033[31mError: Canvas type required\033[0m"
        echo "Usage: ./scripts/canvas.sh example <calendar|document|flight>"
        exit 1
    fi
    
    local config_file="$PROJECT_ROOT/examples/${canvas_type}-config.json"
    
    if [ ! -f "$config_file" ]; then
        echo -e "\033[31mError: Example config not found: $config_file\033[0m"
        exit 1
    fi
    
    local config=$(cat "$config_file")
    
    echo -e "\033[36mSpawning $canvas_type with example config...\033[0m"
    bun run canvas/src/cli.ts spawn "$canvas_type" --config "$config"
}

# Main script execution
check_bun

case "${1:-}" in
    env)
        cmd_env
        ;;
    test)
        cmd_test
        ;;
    install)
        cmd_install
        ;;
    show)
        cmd_show "$2"
        ;;
    spawn)
        cmd_spawn "$2"
        ;;
    example)
        cmd_example "$2"
        ;;
    *)
        show_help
        ;;
esac
