variable "name" {
  description = "The name of your VPC"
}

variable "environment" {
  description = "dev"
}

variable "cidr_block" {
  description = "The CIDR block for the VPC."
}

variable "public_subnets" {
  description = "List of public subnets"
}

variable "private_subnets" {
  description = "List of private subnets"
}

variable "availability_zones" {
  description = "List of availability zones"
}

variable "single_nat" {
  description = "Enable single NAT gateway for all private subnets"
  default     = false
  type        = bool
}
