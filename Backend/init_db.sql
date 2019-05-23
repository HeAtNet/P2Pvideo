DROP DATABASE IF EXISTS p2pvideo;
CREATE DATABASE p2pvideo CHARACTER SET utf8;
USE p2pvideo;

CREATE TABLE `contact` (
  `codeword` varchar(100) NOT NULL,
  `id` varchar(50) NOT NULL DEFAULT '',
  `time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `data` text NOT NULL
);

ALTER TABLE `contact`
  ADD PRIMARY KEY (`codeword`);
COMMIT;
