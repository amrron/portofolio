"use client"

import React, { useEffect, useRef, useState, useCallback } from "react";
import { Terminal } from "@xterm/xterm";
import "@xterm/xterm/css/xterm.css";
import { FitAddon } from "@xterm/addon-fit";

export default function Home() {
    const [position, setPosition] = useState({ x: 100, y: 100 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const [isResizing, setIsResizing] = useState(false);
    const [resizeStart, setResizeStart] = useState({
        width: 0,
        height: 0,
        x: 0,
        y: 0,
    });
    const prefix = "welcome@portofolio-ali:~$ ";
    const [currentLine, setCurrentLine] = useState("");
    const [isInitialized, setIsInitialized] = useState(false);

    const termRef = useRef<HTMLDivElement | null>(null);
    const terminalInstance = useRef<Terminal | null>(null);
    const fitAddon = useRef<FitAddon | null>(null);

    useEffect(() => {
        if (typeof window !== "undefined" && termRef.current) {
            console.log("Initializing terminal...");
            fitAddon.current = new FitAddon();
            terminalInstance.current = new Terminal({
                rows: 40,
                cols: 130,
                fontFamily: "Fira Code, monospace",
                fontSize: 14,
                theme: {
                    background: "#1e1e1e",
                    foreground: "#d4d4d4",
                },
                cursorBlink: true,
            });
            terminalInstance.current.loadAddon(fitAddon.current);
            terminalInstance.current.open(termRef.current);
            fitAddon.current?.fit();

            printWithDelay(neofetch).then(() => {
                if (terminalInstance.current) {
                    terminalInstance.current.write(prefix);
                    setIsInitialized(true);
                }
            });

            // Add event listener for window resize
            window.addEventListener("resize", () => {
                console.log("Window resized, fitting terminal...");
                fitAddon.current?.fit();
            });

            return () => {
                terminalInstance.current?.dispose();
                if (fitAddon.current) {
                    window.removeEventListener("resize", fitAddon.current.fit);
                }
            };
        }
    }, []);

    const printWithDelay = async (lines: string[]) => {
        if (!terminalInstance.current) return;
        for (const line of lines) {
            terminalInstance.current.writeln(line);
            terminalInstance.current.scrollToBottom(); // Scroll to bottom after each line
            await sleep(50);
        }
    };

    const sleep = (ms: number) =>
        new Promise((resolve) => setTimeout(resolve, ms));

    const neofetch = ``.split("\n");

    // Get list of projects
    const getProjects = async () => {
        const response = await fetch("/projects.json");
        const projects = await response.json();
        return projects;
    };

    // Print list of projects
    const printHelpText = (
        terminal: Terminal,
        name: string,
        description: string,
        link: string
    ) => {
        const namePadding = 20; // Adjust the padding as needed
        const terminalWidth = terminal.cols; // Get the width of the terminal
        const maxDescriptionWidth = terminalWidth - namePadding;

        const words = description.split(" ");
        let currentLine = "";
        const lines = [];

        words.forEach((word) => {
            if ((currentLine + word).length > maxDescriptionWidth) {
                lines.push(currentLine.trim());
                currentLine = word + " ";
            } else {
                currentLine += word + " ";
            }
        });

        if (currentLine.trim().length > 0) {
            lines.push(currentLine.trim());
        }

        const paddedName = name.padEnd(namePadding, " ");
        terminal.writeln("");
        terminal.writeln(`${paddedName}${lines[0]}`);
        for (let i = 1; i < lines.length; i++) {
            terminal.writeln(" ".repeat(namePadding) + lines[i]);
        }
        terminal.writeln(
            " ".repeat(namePadding) +
                "[\x1b]8;;" +
                link +
                "\x1b\\Link\x1b]8;;\x1b\\]"
        );
    };

    // Add drag handlers
    const handleMouseDown = useCallback(
        (e: React.MouseEvent) => {
            if (
                e.target instanceof Element &&
                e.target.closest(".terminal-header")
            ) {
                setIsDragging(true);
                setDragOffset({
                    x: e.clientX - position.x,
                    y: e.clientY - position.y,
                });
            }
        },
        [position]
    );

    const handleMouseMove = useCallback(
        (e: MouseEvent) => {
            if (isDragging) {
                setPosition({
                    x: e.clientX - dragOffset.x,
                    y: e.clientY - dragOffset.y,
                });
            } else if (isResizing && termRef.current) {
                const newWidth =
                    resizeStart.width + (e.clientX - resizeStart.x);
                const newHeight =
                    resizeStart.height + (e.clientY - resizeStart.y);
                termRef.current.style.width = `${newWidth}px`;
                termRef.current.style.height = `${newHeight}px`;
                if (fitAddon.current) {
                    fitAddon.current.fit();
                }
            }
        },
        [isDragging, dragOffset, isResizing, resizeStart]
    );

    const handleMouseUp = useCallback(() => {
        setIsDragging(false);
        setIsResizing(false);
    }, []);

    const handleResizeMouseDown = useCallback((e: React.MouseEvent) => {
        if (termRef.current) {
            setIsResizing(true);
            setResizeStart({
                width: termRef.current.offsetWidth,
                height: termRef.current.offsetHeight,
                x: e.clientX,
                y: e.clientY,
            });
        }
    }, []);

    // Add event listeners
    useEffect(() => {
        document.addEventListener("mousemove", handleMouseMove);
        document.addEventListener("mouseup", handleMouseUp);
        return () => {
            document.removeEventListener("mousemove", handleMouseMove);
            document.removeEventListener("mouseup", handleMouseUp);
        };
    }, [handleMouseMove, handleMouseUp]);

    const runCommand = useCallback((command: string) => {
        if (!terminalInstance.current) return;
        if (command === "") {
            return;
        } else if (command === "ls projects") {
            getProjects().then((projects) => {
                if (terminalInstance.current) {
                    terminalInstance.current.writeln("");
                    terminalInstance.current.writeln(
                        "\nThis is the list of project that i've been worked for:"
                    );
                }
                projects.forEach(
                    (project: {
                        name: string;
                        description: string;
                        url: string;
                    }) => {
                        if (terminalInstance.current) {
                            return printHelpText(
                                terminalInstance.current,
                                project.name,
                                project.description,
                                project.url
                            );
                        }
                    }
                );
            });
        } else if (command.startsWith("cd ")) {
            const dir = command.split(" ")[1];
            terminalInstance.current.writeln(`Changed directory to ${dir}`);
        } else {
            terminalInstance.current.writeln(`${command}: command not found`);
        }
    }, []);

    useEffect(() => {
        if (isInitialized && terminalInstance.current) {
            const handleKey = ({
                key,
                domEvent,
            }: {
                key: string;
                domEvent: KeyboardEvent;
            }) => {
                if (!terminalInstance.current) return;

                if (domEvent.key === "Backspace") {
                    if (currentLine.length > 0) {
                        setCurrentLine((prev) => prev.slice(0, -1));
                        terminalInstance.current.write("\b \b");
                    }
                    return;
                }

                if (domEvent.key === "Enter") {
                    terminalInstance.current.writeln("");
                    runCommand(currentLine);
                    setCurrentLine("");
                    terminalInstance.current.write(prefix);
                    return;
                }

                if (!domEvent.altKey && !domEvent.ctrlKey && key.length === 1) {
                    setCurrentLine((prev) => prev + key);
                    terminalInstance.current.write(key);
                }
            };

            const disposable = terminalInstance.current.onKey(handleKey);

            return () => {
                disposable.dispose();
            };
        }
    }, [isInitialized, currentLine, runCommand]);

    return (
        <div className="">
            <div className="terminal-wrapper">
                <div
                    className="terminal-window"
                    style={{
                        position: "absolute",
                        left: `${position.x}px`,
                        top: `${position.y}px`,
                    }}
                >
                    <div
                        className="terminal-header"
                        onMouseDown={handleMouseDown}
                        style={{ cursor: "grab" }}
                    >
                        <div className="terminal-title">Terminal</div>
                        <div className="terminal-subtitle">{prefix}</div>
                        <div className="window-controls">
                            <div className="control minimize"></div>
                            <div className="control maximize"></div>
                            <div className="control close"></div>
                        </div>
                    </div>
                    <div className="terminal-container" ref={termRef}></div>
                    <div
                        className="resize-handle"
                        onMouseDown={handleResizeMouseDown}
                        style={{
                            width: "10px",
                            height: "10px",
                            background: "gray",
                            position: "absolute",
                            right: "0",
                            bottom: "0",
                            cursor: "nwse-resize",
                        }}
                    ></div>
                </div>
            </div>
        </div>
    );
}
