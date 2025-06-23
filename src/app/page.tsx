"use client";

import React from "react";
import {
  Container,
  Typography,
  Button,
  Box,
  Card,
  CardContent,
  Avatar,
  Chip,
} from "@mui/material";
import { Security, Timer, Password, Visibility } from "@mui/icons-material";
import { Navigation } from "@/components/Navigation";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

export default function Home() {
  const router = useRouter();
  const { user } = useAuth();

  const features = [
    {
      icon: <Security />,
      title: "Secure Sharing",
      description: "End-to-end encrypted secrets with secure password hashing",
    },
    {
      icon: <Timer />,
      title: "Time-Limited",
      description: "Set expiration times to automatically delete secrets",
    },
    {
      icon: <Password />,
      title: "Password Protected",
      description: "Add optional password protection for extra security",
    },
    {
      icon: <Visibility />,
      title: "One-Time Access",
      description: "Secrets that self-destruct after first viewing",
    },
  ];

  return (
    <>
      <Navigation />
      <Container maxWidth="lg">
        <Box sx={{ py: 8, textAlign: "center" }}>
          {/* Hero Section */}
          <Typography variant="h1" component="h1" gutterBottom>
            Share Secrets{" "}
            <Typography
              component="span"
              variant="h1"
              sx={{ color: "primary.main" }}
            >
              Securely
            </Typography>
          </Typography>

          <Typography
            variant="h5"
            color="text.secondary"
            sx={{ mb: 4, maxWidth: 600, mx: "auto" }}
          >
            Create time-limited, password-protected secrets that vanish after
            access. Perfect for sharing sensitive information safely.
          </Typography>

          <Box
            sx={{ display: "flex", gap: 2, justifyContent: "center", mb: 8 }}
          >
            <Button
              variant="contained"
              size="large"
              onClick={() => router.push("/create")}
              sx={{ minWidth: 160 }}
            >
              Create Secret
            </Button>
            {!user && (
              <Button
                variant="outlined"
                size="large"
                onClick={() => router.push("/register")}
                sx={{ minWidth: 160 }}
              >
                Get Started
              </Button>
            )}
          </Box>

          {/* Features Grid */}
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
              gap: 4,
              mb: 8,
            }}
          >
            {features.map((feature, index) => (
              <Card
                key={index}
                sx={{ height: "100%", textAlign: "center", p: 2 }}
              >
                <CardContent>
                  <Avatar
                    sx={{
                      bgcolor: "primary.main",
                      width: 56,
                      height: 56,
                      mx: "auto",
                      mb: 2,
                    }}
                  >
                    {feature.icon}
                  </Avatar>
                  <Typography variant="h6" component="h3" gutterBottom>
                    {feature.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {feature.description}
                  </Typography>
                </CardContent>
              </Card>
            ))}
          </Box>

          {/* How It Works */}
          <Box sx={{ textAlign: "left", maxWidth: 800, mx: "auto" }}>
            <Typography
              variant="h3"
              component="h2"
              textAlign="center"
              gutterBottom
            >
              How It Works
            </Typography>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
                gap: 4,
                mt: 4,
              }}
            >
              <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2 }}>
                <Chip label="1" color="primary" />
                <Box>
                  <Typography variant="h6" gutterBottom>
                    Create Your Secret
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Enter your sensitive information and configure security
                    settings
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2 }}>
                <Chip label="2" color="primary" />
                <Box>
                  <Typography variant="h6" gutterBottom>
                    Share the Link
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Get a unique, secure URL to share with your intended
                    recipient
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2 }}>
                <Chip label="3" color="primary" />
                <Box>
                  <Typography variant="h6" gutterBottom>
                    Auto-Delete
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Secret automatically expires and is permanently deleted
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Box>
        </Box>
      </Container>
    </>
  );
}
