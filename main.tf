terraform {
  required_providers {
    archive = {
      source = "hashicorp/archive"
      version = "2.3.0"
    }

    aws = {
      source = "hashicorp/aws"
      version = "4.62.0"
    }
  }
}

provider "aws" {
  region = "ap-northeast-2"
}
