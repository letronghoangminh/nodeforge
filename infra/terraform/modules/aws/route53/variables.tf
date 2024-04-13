variable "dns_zone" {
  type = string
}

variable "environment" {
  type = string
}

variable "custom_records" {
  type = map(object({
    type    = optional(string) // default: CNAME
    ttl     = optional(number) // default: 3600
    records = list(string)
  }))
  default = {}
}
