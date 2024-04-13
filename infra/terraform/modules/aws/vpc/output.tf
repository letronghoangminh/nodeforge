output "id" {
  value = aws_vpc.main.id
}

output "public_subnets" {
  value = aws_subnet.public
}

output "private_subnets" {
  value = aws_subnet.private
}

output "aws_db_subnet_group_name" {
  value = aws_db_subnet_group.private_database.name
}

output "nat_ip" {
  value = aws_eip.nat[*].public_ip
}

output "vpc_cidr" {
  value = aws_vpc.main.cidr_block
}
