variable "name" {
  description = "the name of the alb"
}

variable "environment" {
  description = "dev"
}

variable "public_subnets" {
  description = "Comma separated list of subnet IDs"
}

variable "vpc_id" {
  description = "The ID of VPC"
}

variable "alb_security_groups" {
  description = "Comma separated list of security groups"
}

variable "alb_tls_cert_arn" {
  description = "The ARN of the certificate that the ALB uses for https"
}

variable "health_check_path" {
  description = "Path to check if the service is healthy, e.g. \"/status\""
}

variable "idle_timeout" {
  type    = number
  default = 60
}
