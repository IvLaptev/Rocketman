-- MySQL Workbench Forward Engineering

SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0;
SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0;
SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='TRADITIONAL,ALLOW_INVALID_DATES';

-- -----------------------------------------------------
-- Schema todolist
-- -----------------------------------------------------

-- -----------------------------------------------------
-- Schema todolist
-- -----------------------------------------------------
CREATE SCHEMA IF NOT EXISTS `todolist` DEFAULT CHARACTER SET utf8 ;
USE `todolist` ;

-- -----------------------------------------------------
-- Table `users`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `todolist`.`users` (
  `user_id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `login` VARCHAR(100) NOT NULL,
  `password` VARCHAR(61) NOT NULL,
  PRIMARY KEY (`user_id`),
  UNIQUE INDEX `login_UNIQUE` (`login` ASC),
  UNIQUE INDEX `user_id_UNIQUE` (`user_id` ASC))
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `tasks`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `todolist`.`tasks` (
  `task_id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` INT UNSIGNED NOT NULL,
  `name` VARCHAR(100) BINARY NOT NULL,
  `description` VARCHAR(1000) BINARY NOT NULL,
  `creation_date` DATE NOT NULL,
  `is_archived` TINYINT(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (`task_id`),
  INDEX `fk_tasks_users_idx` (`user_id` ASC),
  UNIQUE INDEX `task_id_UNIQUE` (`task_id` ASC),
  CONSTRAINT `fk_tasks_users`
    FOREIGN KEY (`user_id`)
    REFERENCES `todolist`.`users` (`user_id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


SET SQL_MODE=@OLD_SQL_MODE;
SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS;
SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS;
